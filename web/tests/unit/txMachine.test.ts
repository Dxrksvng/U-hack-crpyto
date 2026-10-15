import { describe, expect, it, vi } from "vitest";
import { JsonRpcVersionUnsupportedError, RpcRequestError, UserRejectedRequestError } from "viem";
import { avalancheFuji as viemFuji } from "viem/chains";
import { getChain } from "@/lib/chains";
import { canRetry, classifyError, runTransfer, sendEligibility, singleFlight, type TxDeps, type TxPatch } from "@/lib/txMachine";

const FROM = "0x00000000000000000000000000000000000000a1" as const;
const TO = "0x00000000000000000000000000000000000000b2" as const;
const HASH = `0x${"ab".repeat(32)}` as const;
const FAST = { prepareMs: 50, broadcastMs: 20, broadcastPollMs: 5, receiptMs: 50 };

function deps(over: Partial<TxDeps> = {}): TxDeps {
  return {
    getAccount: () => ({ status: "connected", address: FROM, chainId: 43113 }),
    getBalance: async () => 10n ** 18n,
    estimateGas: async () => 21_000n,
    getGasPrice: async () => 25_000_000_000n,
    sendTransaction: async () => HASH,
    getTransaction: async () => ({}),
    waitForReceipt: async () => ({ status: "success" }),
    sleep: async () => {},
    ...over,
  };
}
async function run(d: TxDeps, value = 10n ** 15n) {
  const states: TxPatch[] = [];
  const final = await runTransfer(d, { chainId: 43113, from: FROM, to: TO, value }, (p) => states.push(p), FAST);
  return { final, statuses: states.map((s) => s.status) };
}

describe("Fuji configuration", () => {
  it("uses chain 43113, the official public RPC, AVAX and the Avalanche explorer", () => {
    const c = getChain(43113);
    expect(c.id).toBe(43113);
    expect(c.symbol).toBe("AVAX");
    expect(c.live).toBe(true);
    expect(c.rpc).toBe("https://api.avax-test.network/ext/bc/C/rpc");
    expect(c.rpc).toBe(viemFuji.rpcUrls.default.http[0]);
    expect(c.explorer).toBe("https://explorer-test.avax.network/c-chain");
  });
});

describe("runTransfer", () => {
  it("success: advances through every state only after each operation, then confirms on receipt", async () => {
    const { final, statuses } = await run(deps());
    expect(statuses).toEqual(["preparing", "awaiting_approval", "broadcasting", "pending_confirmation", "confirmed"]);
    expect(final.hash).toBe(HASH);
    expect(final.seen).toBe(true);
  });

  it("passes an explicit gas limit so the wallet does not re-estimate", async () => {
    const send = vi.fn(async () => HASH);
    await run(deps({ sendTransaction: send }));
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ gas: 21_000n, chainId: 43113, to: TO, account: FROM }));
  });

  it("wallet disconnected: fails at preparing and never calls the wallet", async () => {
    const send = vi.fn();
    const { final } = await run(deps({ getAccount: () => ({ status: "disconnected" }), sendTransaction: send }));
    expect(final).toMatchObject({ status: "failed", failedStep: "preparing", errorKind: "not_connected" });
    expect(send).not.toHaveBeenCalled();
  });

  it("wrong network: fails at preparing", async () => {
    const { final } = await run(deps({ getAccount: () => ({ status: "connected", address: FROM, chainId: 11155111 }) }));
    expect(final).toMatchObject({ status: "failed", failedStep: "preparing", errorKind: "wrong_network" });
  });

  it("insufficient funds for amount + gas: fails at preparing", async () => {
    const { final } = await run(deps({ getBalance: async () => 10n ** 15n }), 10n ** 15n);
    expect(final).toMatchObject({ status: "failed", failedStep: "preparing", errorKind: "insufficient_funds" });
  });

  it("RPC timeout during preparation", async () => {
    const { final } = await run(deps({ estimateGas: () => new Promise(() => {}) }));
    expect(final).toMatchObject({ status: "failed", failedStep: "preparing", errorKind: "timeout" });
  });

  it("wallet rejection shows rejected, not a network error", async () => {
    const { final } = await run(deps({ sendTransaction: async () => Promise.reject(new UserRejectedRequestError(new Error("User denied"))) }));
    expect(final).toMatchObject({ status: "rejected", failedStep: "awaiting_approval", errorKind: "rejected" });
    expect(final.hash).toBeUndefined();
  });

  it("unsupported JSON-RPC response (-32006) is attributed to the wallet approval step with details", async () => {
    const err = new JsonRpcVersionUnsupportedError(new RpcRequestError({ body: {}, url: "wallet", error: { code: -32006, message: "provider says no" } }));
    const { final } = await run(deps({ sendTransaction: async () => Promise.reject(err) }));
    expect(final).toMatchObject({ status: "failed", failedStep: "awaiting_approval", errorKind: "rpc_unsupported" });
    expect(final.details).toContain("provider says no");
  });

  it("reverted receipt is a failure at confirmation, keeping the hash", async () => {
    const { final } = await run(deps({ waitForReceipt: async () => ({ status: "reverted" }) }));
    expect(final).toMatchObject({ status: "failed", failedStep: "pending_confirmation", errorKind: "reverted", hash: HASH });
  });

  it("receipt polling failure after a hash gives confirmation_unknown", async () => {
    const e = Object.assign(new Error("timed out"), { name: "WaitForTransactionReceiptTimeoutError" });
    const { final } = await run(deps({ waitForReceipt: async () => Promise.reject(e) }));
    expect(final).toMatchObject({ status: "confirmation_unknown", hash: HASH });
    expect(canRetry(final.status, final.hash)).toBe(false);
  });

  it("node never sees the tx: still waits for receipt, marked unseen", async () => {
    const { final } = await run(deps({ getTransaction: async () => Promise.reject(new Error("not found")) }));
    expect(final).toMatchObject({ status: "confirmed", seen: false });
  });
});

describe("classifyError", () => {
  it("maps EIP-1193 codes", () => {
    expect(classifyError({ code: 4001 })).toBe("rejected");
    expect(classifyError({ code: -32006 })).toBe("rpc_unsupported");
    expect(classifyError({ code: 4901 })).toBe("wrong_network");
    expect(classifyError(new Error("x"))).toBe("unknown");
  });
});

describe("retry and duplicate prevention", () => {
  it("retry is offered only without a hash", () => {
    expect(canRetry("failed")).toBe(true);
    expect(canRetry("rejected")).toBe(true);
    expect(canRetry("failed", HASH)).toBe(false);
    expect(canRetry("confirmed")).toBe(false);
  });

  it("singleFlight ignores a second submission while the first runs", async () => {
    let release!: () => void;
    const fn = vi.fn(() => new Promise<string>((r) => (release = () => r("ok"))));
    const once = singleFlight(fn);
    const a = once();
    const b = await once();
    expect(b).toBeNull();
    release();
    expect(await a).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("sendEligibility", () => {
  const ok = { chainLive: true, connected: true, walletChainId: 43113, chainId: 43113, destinationValid: true, hasCheck: true, amount: "0.01", balance: 10n ** 18n, fee: 10n ** 14n };
  it("allows a fully valid transfer", () => expect(sendEligibility(ok)).toBeNull());
  it.each([
    [{ chainLive: false }, "check_only_chain"],
    [{ connected: false }, "not_connected"],
    [{ walletChainId: 1 }, "wrong_network"],
    [{ destinationValid: false }, "no_destination"],
    [{ amount: "" }, "amountInvalid"],
    [{ balance: undefined }, "balance_unknown"],
    [{ fee: undefined }, "fee_unknown"],
    [{ amount: "2" }, "insufficient"],
    [{ balance: 10n ** 16n, fee: 10n ** 16n }, "gasUnaffordable"],
    [{ hasCheck: false }, "needs_check"],
  ])("blocks %o as %s", (patch, reason) => expect(sendEligibility({ ...ok, ...patch })).toBe(reason));
});
