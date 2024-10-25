import { SirContract } from "@/contracts/sir";
import { useSimulateContract } from "wagmi";

export function useClaimTeaRewards({
  vaultId,
  claimAndStake,
}: {
  vaultId: bigint;
  claimAndStake: boolean;
}) {
  console.log(claimAndStake, "claimAndStake");
  console.log({
    ...SirContract,
    functionName: claimAndStake ? "lPerMintAndStake" : "lPerMint",
    args: [vaultId],
  });
  const { data: teaRewardData } = useSimulateContract({
    ...SirContract,
    functionName: claimAndStake ? "lPerMintAndStake" : "lPerMint",
    args: [vaultId],
  });
  return { claimRewardRequest: teaRewardData?.request };
}
