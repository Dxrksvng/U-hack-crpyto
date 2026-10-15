import { getAddress, isAddress } from "viem";

export type AddressStatus = "empty" | "invalid" | "bad_checksum" | "valid";

export function validateAddress(raw: string): AddressStatus {
  const v = raw.trim();
  if (!v) return "empty";
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return "invalid";
  const mixed = v.slice(2) !== v.slice(2).toLowerCase() && v.slice(2) !== v.slice(2).toUpperCase();
  if (mixed && !isAddress(v, { strict: true })) return "bad_checksum";
  return "valid";
}

export function toChecksum(v: string): `0x${string}` {
  return getAddress(v.trim());
}

export function truncate(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, 2 + head)}…${addr.slice(-tail)}`;
}

/** T0 address-poisoning check: same first 4 + last 4 hex chars, different middle. */
export function findLookalike(dest: string, recents: string[]): string | undefined {
  const d = dest.toLowerCase();
  return recents.find((r) => {
    const x = r.toLowerCase();
    return x !== d && x.slice(2, 6) === d.slice(2, 6) && x.slice(-4) === d.slice(-4);
  });
}

// Mock recent recipients, in memory only (privacy promise: never persisted).
export const MOCK_RECENT_RECIPIENTS = [
  "0x1a2B3c4D5e6F708192a3B4c5D6e7F8091A2b3C4d",
  "0x7F3c9e21Bd4A0c5e8f1D2b3A4c5D6e7F80913a9B",
];
