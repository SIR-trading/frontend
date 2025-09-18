// This hook is deprecated - we no longer simulate burn transactions
// Keeping it for compatibility but it returns null
export function useBurnApe({
  data,
  isApe,
  amount,
  balance,
}: {
  amount: bigint;
  isApe: boolean;
  balance?: bigint;
  data:
    | {
        leverageTier: number | undefined;
        debtToken: `0x${string}` | undefined;
        collateralToken: `0x${string}` | undefined;
      }
    | undefined;
}) {
  // No longer simulating - return null data
  return { data: null, isFetching: false };
}
