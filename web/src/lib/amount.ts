import { parseEther } from "viem";

export type AmountError = "amountInvalid" | "amountPrecision" | "insufficient" | "gasUnaffordable";

/** Validates a native-token amount string. Balance and fee are in wei and optional (unknown until connected). */
export function validateAmount(amount: string, balanceWei?: bigint, feeWei?: bigint): AmountError | null {
  const v = amount.trim();
  if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return "amountInvalid";
  const [, frac = ""] = v.split(".");
  if (frac.length > 18) return "amountPrecision";
  let wei: bigint;
  try {
    wei = parseEther(v);
  } catch {
    return "amountInvalid";
  }
  if (wei <= 0n) return "amountInvalid";
  if (balanceWei != null && wei > balanceWei) return "insufficient";
  if (balanceWei != null && feeWei != null && wei + feeWei > balanceWei) return "gasUnaffordable";
  return null;
}

export function toWei(amount: string): bigint | null {
  try {
    return validateAmount(amount) ? null : parseEther(amount.trim());
  } catch {
    return null;
  }
}
