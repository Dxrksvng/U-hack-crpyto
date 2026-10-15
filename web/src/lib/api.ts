import { CheckResultSchema, type CheckResult } from "@/domain/types";
import { demoCheck } from "@/fixtures/demo";

export type { CheckResult, Evidence, TierStatus, Verdict, Tier } from "@/domain/types";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
export const isDemoMode = !API_URL;

export class CheckError extends Error {
  constructor(
    public kind: "timeout" | "network" | "server" | "invalid_response" | "aborted",
    message: string,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 10_000;
const RETRIES = 1;

/**
 * Only chainId and destination leave the browser. Never the sender or the amount.
 * Supports cancellation (signal), a per-attempt timeout, one retry on network/5xx, and runtime schema validation.
 */
export async function checkDestination(
  chainId: number,
  destination: `0x${string}`,
  opts: { signal?: AbortSignal } = {},
): Promise<{ result: CheckResult; demo: boolean }> {
  if (!API_URL) {
    try {
      return { result: CheckResultSchema.parse(await demoCheck(chainId, destination, opts.signal)), demo: true };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw new CheckError("aborted", "aborted");
      throw e;
    }
  }
  let last: CheckError | null = null;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    opts.signal?.addEventListener("abort", onAbort);
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/v1/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain_id: chainId, destination }),
        signal: ctrl.signal,
      });
      if (res.status >= 500) throw new CheckError("server", `server ${res.status}`);
      if (!res.ok) throw new CheckError("server", `request rejected ${res.status}`);
      const parsed = CheckResultSchema.safeParse(await res.json());
      if (!parsed.success) throw new CheckError("invalid_response", parsed.error.message);
      return { result: parsed.data, demo: false };
    } catch (e) {
      if (opts.signal?.aborted) throw new CheckError("aborted", "aborted");
      if (e instanceof CheckError) last = e;
      else if (e instanceof DOMException && e.name === "AbortError") last = new CheckError("timeout", "timeout");
      else last = new CheckError("network", e instanceof Error ? e.message : String(e));
      if (last.kind === "invalid_response" || (last.kind === "server" && !last.message.startsWith("server"))) break;
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
    }
  }
  throw last ?? new CheckError("network", "unknown");
}

export async function reportAddress(_input: { chainId: number; address: string; reason: string; note: string }): Promise<{ ok: true }> {
  // DEMO: the real flow asks the wallet to sign and records the report on-chain with no personal data.
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true };
}
