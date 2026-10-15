import { useEstimateGas, useGasPrice } from "wagmi";

/** Network fee estimate (gas * gasPrice) in wei, or undefined when it cannot be estimated. Never fabricated. */
export function useFeeEstimate(p: { account?: `0x${string}`; to?: `0x${string}`; value?: bigint | null; chainId: number; enabled: boolean }) {
  const enabled = p.enabled && Boolean(p.account && p.to && p.value != null);
  const gas = useEstimateGas({ account: p.account, to: p.to, value: p.value ?? undefined, chainId: p.chainId, query: { enabled } });
  const price = useGasPrice({ chainId: p.chainId, query: { enabled } });
  const fee = gas.data != null && price.data != null ? gas.data * price.data : undefined;
  return { fee, loading: enabled && (gas.isLoading || price.isLoading), error: gas.error ?? price.error };
}
