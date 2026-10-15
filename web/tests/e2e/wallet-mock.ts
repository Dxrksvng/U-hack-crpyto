import type { Page, Route } from "@playwright/test";
import { decodeFunctionData, encodeFunctionResult, multicall3Abi } from "viem";

/**
 * Test-only wallet: an EIP-1193 provider announced over EIP-6963, so the app's real wagmi connect path runs.
 * Public RPC reads (balance, gas, receipts) are answered by intercepting the chain RPC URLs. No funds, no network.
 */
export const MOCK_ACCOUNT = "0x00000000000000000000000000000000000000a1";
export const MOCK_HASH = `0x${"ab".repeat(32)}`;

export type WalletScenario = {
  chainId?: number;
  /** eth_sendTransaction behaviour */
  send?: "ok" | "reject" | "rpc32006" | "slow";
  /** wei, hex */
  balance?: string;
  /** receipt behaviour on the public RPC */
  receipt?: "success" | "reverted" | "never";
  /** The site was approved in this wallet before (eth_accounts returns the account without a prompt). */
  preAuthorized?: boolean;
};

export async function installMockWallet(page: Page, sc: WalletScenario = {}) {
  const chainId = sc.chainId ?? 43113;
  await page.addInitScript(
    ({ account, hash, chainId, send, preAuthorized }) => {
      let authorized = preAuthorized;
      const w = window as unknown as Record<string, unknown>;
      w.__BS_TX_TIMEOUTS = { broadcastMs: 400, broadcastPollMs: 100, receiptMs: 6000 };
      w.__sendCount = 0;
      let chain = chainId;
      const listeners: Record<string, ((...a: unknown[]) => void)[]> = {};
      const emit = (ev: string, ...a: unknown[]) => (listeners[ev] ?? []).forEach((f) => f(...a));
      const rpcErr = (code: number, message: string) => Object.assign(new Error(message), { code });
      const provider = {
        isMetaMask: true,
        on: (ev: string, f: (...a: unknown[]) => void) => ((listeners[ev] ??= []).push(f), provider),
        removeListener: (ev: string, f: (...a: unknown[]) => void) => ((listeners[ev] = (listeners[ev] ?? []).filter((x) => x !== f)), provider),
        async request({ method, params }: { method: string; params?: unknown[] }) {
          switch (method) {
            case "eth_requestAccounts":
              authorized = true;
              return [account];
            case "eth_accounts":
              return authorized ? [account] : [];
            case "eth_chainId":
              return `0x${chain.toString(16)}`;
            case "net_version":
              return String(chain);
            case "wallet_requestPermissions":
              authorized = true;
              return [{ parentCapability: "eth_accounts" }];
            case "wallet_getPermissions":
              return authorized ? [{ parentCapability: "eth_accounts" }] : [];
            case "wallet_revokePermissions":
              return null;
            case "wallet_switchEthereumChain": {
              chain = parseInt((params?.[0] as { chainId: string }).chainId, 16);
              emit("chainChanged", `0x${chain.toString(16)}`);
              return null;
            }
            case "eth_sendTransaction": {
              (w.__sendCount as number)++;
              w.__lastTx = params?.[0];
              if (send === "reject") throw rpcErr(4001, "User denied transaction signature.");
              if (send === "rpc32006") throw rpcErr(-32006, "Version of JSON-RPC protocol is not supported.");
              if (send === "slow") await new Promise((r) => setTimeout(r, 1500));
              return hash;
            }
            default:
              throw rpcErr(4200, `mock wallet: unsupported ${method}`);
          }
        },
      };
      const info = { uuid: "00000000-0000-4000-8000-000000000001", name: "MetaMask", icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>", rdns: "io.metamask" };
      const announce = () => window.dispatchEvent(new CustomEvent("eip6963:announceProvider", { detail: Object.freeze({ info, provider }) }));
      window.addEventListener("eip6963:requestProvider", announce);
      announce();
    },
    { account: MOCK_ACCOUNT, hash: MOCK_HASH, chainId, send: sc.send ?? "ok", preAuthorized: sc.preAuthorized ?? false },
  );

  const balance = sc.balance ?? "0xde0b6b3a7640000"; // 1 AVAX
  const receipt = sc.receipt ?? "success";
  const handle = (m: { id: number; method: string; params?: unknown[] }) => {
    const r = (result: unknown) => ({ jsonrpc: "2.0", id: m.id, result });
    switch (m.method) {
      case "eth_chainId":
        return r("0xa869");
      case "eth_getBalance":
        return r(balance);
      case "eth_call": {
        // viem reads native balances through Multicall3 (aggregate3 of getEthBalance).
        const call = (m.params?.[0] ?? {}) as { data: `0x${string}` };
        let decoded: ReturnType<typeof decodeFunctionData<typeof multicall3Abi>> | undefined;
        try {
          decoded = decodeFunctionData({ abi: multicall3Abi, data: call.data });
        } catch {
          // viem replays a reverted tx with eth_call to find the revert reason.
          return { jsonrpc: "2.0", id: m.id, error: { code: 3, message: "execution reverted", data: "0x" } };
        }
        const { functionName, args } = decoded;
        if (functionName !== "aggregate3") return { jsonrpc: "2.0", id: m.id, error: { code: -32000, message: `mock rpc: eth_call ${functionName}` } };
        const calls = args[0] as readonly unknown[];
        const one = encodeFunctionResult({ abi: multicall3Abi, functionName: "getEthBalance", result: BigInt(balance) });
        return r(encodeFunctionResult({ abi: multicall3Abi, functionName: "aggregate3", result: calls.map(() => ({ success: true, returnData: one })) }));
      }
      case "eth_estimateGas":
        return r("0x5208");
      case "eth_gasPrice":
        return r("0x5d21dba00"); // 25 gwei
      case "eth_blockNumber":
        return r("0x100");
      case "eth_getTransactionByHash":
        return r({
          hash: MOCK_HASH, blockHash: null, blockNumber: null, transactionIndex: null, from: MOCK_ACCOUNT, to: MOCK_ACCOUNT,
          value: "0x1", gas: "0x5208", gasPrice: "0x5d21dba00", nonce: "0x0", input: "0x", type: "0x0", v: "0x1b", r: "0x1", s: "0x1", chainId: "0xa869",
        });
      case "eth_getTransactionReceipt":
        if (receipt === "never") return r(null);
        return r({
          transactionHash: MOCK_HASH, blockHash: `0x${"cd".repeat(32)}`, blockNumber: "0xff", transactionIndex: "0x0", from: MOCK_ACCOUNT, to: MOCK_ACCOUNT,
          status: receipt === "success" ? "0x1" : "0x0", gasUsed: "0x5208", cumulativeGasUsed: "0x5208", effectiveGasPrice: "0x5d21dba00",
          logs: [], logsBloom: `0x${"0".repeat(512)}`, contractAddress: null, type: "0x0",
        });
      case "eth_getBlockByNumber":
        return r({ number: "0x100", hash: `0x${"ef".repeat(32)}`, timestamp: "0x1", transactions: [], baseFeePerGas: "0x1" });
      default:
        return { jsonrpc: "2.0", id: m.id, error: { code: -32601, message: `mock rpc: ${m.method}` } };
    }
  };
  const fulfil = async (route: Route) => {
    const body = route.request().postDataJSON();
    const out = Array.isArray(body) ? body.map(handle) : handle(body);
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
  };
  await page.route("https://api.avax-test.network/**", fulfil);
  await page.route("https://rpc.walletconnect.org/**", fulfil);
}

export async function connectMockWallet(page: Page) {
  await page.getByTestId("connect-button").click();
  await page.getByTestId("wallet-metamask").click();
  await page.getByTestId("wallet-chip").waitFor({ timeout: 10_000 });
}
