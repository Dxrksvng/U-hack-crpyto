import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckError, checkDestination } from "@/lib/api";
import { DEFAULT_CHAIN_ID } from "@/lib/chains";
import type { CheckRecord, SendRecord } from "@/domain/types";

/**
 * Session state. In memory only: addresses, checks and transfers are never written to storage
 * (privacy promise). Refreshing the page clears everything.
 */
export type CheckStatus = "idle" | "checking" | "done" | "error";

type Session = {
  chainId: number;
  setChainId: (id: number) => void;
  destination: string;
  setDestination: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;

  status: CheckStatus;
  error: CheckError | null;
  /** The check for exactly the current chain + destination, or null if stale/missing. */
  current: CheckRecord | null;
  runCheck: (chainId: number, dest: `0x${string}`) => Promise<CheckRecord | null>;
  cancelCheck: () => void;

  checks: CheckRecord[];
  getCheck: (id: string) => CheckRecord | undefined;
  selectCheck: (id: string) => void;
  sends: SendRecord[];
  addSend: (r: SendRecord) => void;
  updateSend: (id: string, patch: Partial<SendRecord>) => void;

  acknowledged: Set<string>;
  acknowledge: (checkId: string) => void;
};

const Ctx = createContext<Session | null>(null);
export const checkKey = (chainId: number, dest: string) => `${chainId}:${dest.trim().toLowerCase()}`;
let seqId = 0;
export const newId = (p: string) => `${p}_${Date.now().toString(36)}${(++seqId).toString(36)}`;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [chainId, setChainIdRaw] = useState(DEFAULT_CHAIN_ID);
  const [destination, setDestinationRaw] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [error, setError] = useState<CheckError | null>(null);
  const [latestId, setLatestId] = useState<string | null>(null);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [sends, setSends] = useState<SendRecord[]>([]);
  const [acknowledged, setAck] = useState<Set<string>>(() => new Set());
  const ctrl = useRef<AbortController | null>(null);
  const inflightKey = useRef<string | null>(null);

  const cancelCheck = useCallback(() => {
    ctrl.current?.abort();
    ctrl.current = null;
    inflightKey.current = null;
    setStatus((s) => (s === "checking" ? "idle" : s));
  }, []);

  const runCheck = useCallback(async (cid: number, dest: `0x${string}`) => {
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    inflightKey.current = checkKey(cid, dest);
    setStatus("checking");
    setError(null);
    try {
      const { result, demo } = await checkDestination(cid, dest, { signal: c.signal });
      if (c.signal.aborted || ctrl.current !== c) return null; // stale response
      const rec: CheckRecord = { id: newId("chk"), chainId: cid, destination: dest, result, demo, createdAt: Date.now() };
      setChecks((xs) => [rec, ...xs]);
      setLatestId(rec.id);
      setStatus("done");
      return rec;
    } catch (e) {
      if (ctrl.current !== c) return null;
      const err = e instanceof CheckError ? e : new CheckError("network", String(e));
      if (err.kind === "aborted") return null;
      setError(err);
      setStatus("error");
      return null;
    } finally {
      if (ctrl.current === c) ctrl.current = null;
    }
  }, []);

  // Editing the destination or chain invalidates any in-flight or previous check.
  const setDestination = useCallback(
    (v: string) => {
      setDestinationRaw(v);
      if (inflightKey.current && inflightKey.current !== checkKey(chainId, v)) cancelCheck();
      setError(null);
    },
    [chainId, cancelCheck],
  );
  const setChainId = useCallback(
    (id: number) => {
      setChainIdRaw(id);
      cancelCheck();
      setError(null);
    },
    [cancelCheck],
  );

  const getCheck = useCallback((id: string) => checks.find((c) => c.id === id), [checks]);
  const latest = latestId ? checks.find((c) => c.id === latestId) : undefined;
  const current = latest && checkKey(latest.chainId, latest.destination) === checkKey(chainId, destination) ? latest : null;

  const value = useMemo<Session>(
    () => ({
      chainId,
      setChainId,
      destination,
      setDestination,
      amount,
      setAmount,
      status: current || status !== "done" ? status : "idle",
      error,
      current,
      runCheck,
      cancelCheck,
      checks,
      getCheck,
      selectCheck: (id) => {
        const record = checks.find((check) => check.id === id);
        if (!record) return;
        cancelCheck();
        setChainIdRaw(record.chainId);
        setDestinationRaw(record.destination);
        setLatestId(record.id);
        setError(null);
        setStatus("done");
      },
      sends,
      addSend: (r) => setSends((xs) => [r, ...xs]),
      updateSend: (id, patch) => setSends((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      acknowledged,
      acknowledge: (id) => setAck((s) => new Set(s).add(id)),
    }),
    [chainId, setChainId, destination, setDestination, amount, status, error, current, runCheck, cancelCheck, checks, getCheck, sends, acknowledged],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}
