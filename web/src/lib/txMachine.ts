import { BaseError, isAddress } from "viem";
import type { AmountError } from "./amount";
import { validateAmount } from "./amount";

type Hex = `0x${string}`;

/** Lifecycle of a live testnet transfer. A state is entered only after the previous operation succeeded. */
export type TxStatus =
  | "preparing"
  | "awaiting_approval"
  | "broadcasting"
  | "pending_confirmation"
  | "confirmed"
  | "rejected"
  | "failed"
  | "confirmation_unknown"
  | "replaced";

export const TX_STEPS = ["preparing", "awaiting_approval", "broadcasting", "pending_confirmation", "confirmed"] as const;
export type TxStep = (typeof TX_STEPS)[number];

export type TxErrorKind =
  | "not_connected"
  | "account_changed"
  | "wrong_network"
  | "invalid_input"
  | "insufficient_funds"
  | "rejected"
  | "rpc_unsupported"
  | "timeout"
  | "reverted"
  | "unknown";

export type TxPatch = {
  status: TxStatus;
  failedStep?: TxStep;
  errorKind?: TxErrorKind;
  /** Technical detail for the expandable section. Never shown as the primary message. */
  details?: string;
  hash?: Hex;
  /** True once a public RPC node returned the transaction by hash. */
  seen?: boolean;
  /** Actual fee (gasUsed x effectiveGasPrice) and block time in ms, from the receipt. */
  feeWei?: bigint;
  confirmedAt?: number;
};

export type TxParams = { chainId: number; from: Hex; to: Hex; value: bigint };

/** Everything the runner touches, injectable so every path is testable without a wallet or network. */
export type TxDeps = {
  getAccount: () => { status: string; address?: Hex; chainId?: number };
  getBalance: (a: { address: Hex; chainId: number }) => Promise<bigint>;
  estimateGas: (a: { account: Hex; to: Hex; value: bigint; chainId: number }) => Promise<bigint>;
  getGasPrice: (a: { chainId: number }) => Promise<bigint>;
  /** Wallet call (eth_sendTransaction via the connector's EIP-1193 provider). */
  sendTransaction: (a: { account: Hex; to: Hex; value: bigint; gas: bigint; chainId: number }) => Promise<Hex>;
  /** Resolves when a node knows the transaction; rejects otherwise. */
  getTransaction: (a: { hash: Hex; chainId: number }) => Promise<unknown>;
  waitForReceipt: (a: { hash: Hex; chainId: number; timeout: number; onReplaced: (reason: string, hash: Hex) => void }) => Promise<{ status: "success" | "reverted"; feeWei?: bigint; blockTime?: number }>;
  sleep: (ms: number) => Promise<void>;
};

export type TxTimeouts = { prepareMs: number; broadcastMs: number; broadcastPollMs: number; receiptMs: number };
export const DEFAULT_TIMEOUTS: TxTimeouts = { prepareMs: 20_000, broadcastMs: 30_000, broadcastPollMs: 2_000, receiptMs: 180_000 };

function codeOf(e: unknown): number | undefined {
  if (typeof e === "object" && e !== null && typeof (e as { code?: unknown }).code === "number") return (e as { code: number }).code;
  return undefined;
}

/** Maps a thrown error to a kind by walking the viem cause chain. Code -32006 is how viem names "JSON-RPC version not supported". */
export function classifyError(e: unknown): TxErrorKind {
  const chain: unknown[] = [];
  let cur: unknown = e;
  for (let i = 0; cur && i < 10; i++) {
    chain.push(cur);
    cur = (cur as { cause?: unknown }).cause;
  }
  const has = (pred: (x: unknown) => boolean) => chain.some(pred);
  const name = (x: unknown) => (typeof x === "object" && x !== null ? String((x as { name?: unknown }).name ?? "") : "");
  if (has((x) => codeOf(x) === 4001 || name(x) === "UserRejectedRequestError")) return "rejected";
  if (has((x) => name(x) === "ChainMismatchError" || name(x) === "ConnectorChainMismatchError" || codeOf(x) === 4901)) return "wrong_network";
  if (has((x) => name(x) === "ConnectorNotConnectedError" || name(x) === "ConnectorAccountNotFoundError" || codeOf(x) === 4100)) return "not_connected";
  if (has((x) => name(x) === "InsufficientFundsError")) return "insufficient_funds";
  if (has((x) => codeOf(x) === -32006 || name(x) === "JsonRpcVersionUnsupportedError")) return "rpc_unsupported";
  if (has((x) => name(x) === "TimeoutError" || name(x) === "WaitForTransactionReceiptTimeoutError" || name(x) === "BridgeTimeout")) return "timeout";
  return "unknown";
}

/** Technical detail: the full viem message (includes the provider's own text and code), capped. */
export function errorDetails(e: unknown): string {
  const code = codeOf(e) ?? (e instanceof BaseError ? codeOf(e.walk((x) => codeOf(x) != null)) : undefined);
  const msg = e instanceof Error ? e.message : String(e);
  return `${code != null ? `code ${code}: ` : ""}${msg}`.slice(0, 1500);
}

class BridgeTimeout extends Error {
  name = "BridgeTimeout";
}
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const h = setTimeout(() => rej(new BridgeTimeout(`Timed out after ${ms} ms`)), ms);
    p.then(
      (v) => (clearTimeout(h), res(v)),
      (err) => (clearTimeout(h), rej(err)),
    );
  });
}

/**
 * Runs one transfer. Emits a patch on every real state change and never reports success without a receipt.
 * Pre-flight reads (balance, gas, price) go through the app's public RPC, so the wallet is asked only to sign
 * and broadcast with an explicit gas limit. That isolates wallet-side errors to the approval step.
 */
export async function runTransfer(deps: TxDeps, p: TxParams, emit: (patch: TxPatch) => void, t: TxTimeouts = DEFAULT_TIMEOUTS): Promise<TxPatch> {
  let last: TxPatch = { status: "preparing" };
  const step = (patch: TxPatch) => {
    last = { ...last, ...patch };
    emit(patch);
    return last;
  };
  const fail = (failedStep: TxStep, errorKind: TxErrorKind, details?: string) =>
    step({ status: errorKind === "rejected" ? "rejected" : "failed", failedStep, errorKind, details });

  step({ status: "preparing" });
  const acct = deps.getAccount();
  if (acct.status !== "connected" || !acct.address) return fail("preparing", "not_connected");
  if (acct.address.toLowerCase() !== p.from.toLowerCase()) return fail("preparing", "account_changed");
  if (acct.chainId !== p.chainId) return fail("preparing", "wrong_network", `wallet chain ${acct.chainId}, transfer chain ${p.chainId}`);
  if (!isAddress(p.to) || p.value <= 0n) return fail("preparing", "invalid_input");

  let gas: bigint;
  try {
    const [balance, g, price] = await withTimeout(
      Promise.all([
        deps.getBalance({ address: p.from, chainId: p.chainId }),
        deps.estimateGas({ account: p.from, to: p.to, value: p.value, chainId: p.chainId }),
        deps.getGasPrice({ chainId: p.chainId }),
      ]),
      t.prepareMs,
    );
    gas = g;
    if (p.value + g * price > balance) return fail("preparing", "insufficient_funds", `balance ${balance} wei < value ${p.value} + gas ${g} x ${price}`);
  } catch (e) {
    return fail("preparing", classifyError(e), errorDetails(e));
  }

  step({ status: "awaiting_approval" });
  let hash: Hex;
  try {
    hash = await deps.sendTransaction({ account: p.from, to: p.to, value: p.value, gas, chainId: p.chainId });
  } catch (e) {
    return fail("awaiting_approval", classifyError(e), errorDetails(e));
  }

  step({ status: "broadcasting", hash });
  let seen = false;
  for (let waited = 0; waited < t.broadcastMs && !seen; waited += t.broadcastPollMs) {
    try {
      await deps.getTransaction({ hash, chainId: p.chainId });
      seen = true;
    } catch {
      await deps.sleep(t.broadcastPollMs);
    }
  }

  step({ status: "pending_confirmation", seen });
  let replaced: Hex | undefined;
  try {
    const r = await deps.waitForReceipt({
      hash,
      chainId: p.chainId,
      timeout: t.receiptMs,
      onReplaced: (reason, h) => {
        if (reason !== "repriced") replaced = h;
        else step({ status: "pending_confirmation", hash: h });
      },
    });
    if (replaced) return step({ status: "replaced", hash: replaced });
    if (r.status === "success") return step({ status: "confirmed", feeWei: r.feeWei, confirmedAt: r.blockTime });
    return fail("pending_confirmation", "reverted", "Receipt status: reverted");
  } catch (e) {
    return step({ status: "confirmation_unknown", errorKind: classifyError(e), details: errorDetails(e) });
  }
}

export const IN_FLIGHT: TxStatus[] = ["preparing", "awaiting_approval", "broadcasting", "pending_confirmation"];

/** Retry is safe only when no transaction hash exists: nothing could have reached the network. */
export const canRetry = (status: TxStatus, hash?: string) => (status === "failed" || status === "rejected") && !hash;

/** Wraps an async function so a second call while the first is running is ignored (returns null). */
export function singleFlight<A extends unknown[], R>(fn: (...a: A) => Promise<R>) {
  let running = false;
  return async (...a: A): Promise<R | null> => {
    if (running) return null;
    running = true;
    try {
      return await fn(...a);
    } finally {
      running = false;
    }
  };
}

export type SendBlock =
  | "check_only_chain"
  | "not_connected"
  | "wrong_network"
  | "no_destination"
  | "needs_check"
  | "balance_unknown"
  | "fee_unknown"
  | AmountError;

/**
 * Whether the Send button may be enabled. Requires a real connected wallet on the selected live chain,
 * a valid destination with a finished check, a valid amount, and a known balance that covers amount + fee.
 */
export function sendEligibility(p: {
  chainLive: boolean;
  connected: boolean;
  walletChainId?: number;
  chainId: number;
  destinationValid: boolean;
  hasCheck: boolean;
  amount: string;
  balance?: bigint;
  fee?: bigint;
}): SendBlock | null {
  if (!p.chainLive) return "check_only_chain";
  if (!p.connected) return "not_connected";
  if (p.walletChainId !== p.chainId) return "wrong_network";
  if (!p.destinationValid) return "no_destination";
  const amountErr = validateAmount(p.amount);
  if (amountErr) return amountErr;
  if (p.balance == null) return "balance_unknown";
  if (p.fee == null) return "fee_unknown";
  const full = validateAmount(p.amount, p.balance, p.fee);
  if (full) return full;
  if (!p.hasCheck) return "needs_check";
  return null;
}
