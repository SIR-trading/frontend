// This hook is no longer needed - direct writeContract calls should be used instead
// Kept for backwards compatibility but returns contract config for direct calls
export function useClaimTeaRewards({
  vaultId,
  claimAndStake,
}: {
  vaultId: bigint;
  claimAndStake: boolean;
}) {
  // Return the contract config data needed for writeContract
  return {
    vaultId,
    functionName: claimAndStake ? "lperMintAndStake" : "lperMint"
  };
}
