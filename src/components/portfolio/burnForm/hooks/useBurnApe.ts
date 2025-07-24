import { useSimulateContract } from "wagmi";
import { VaultContract } from "@/contracts/vault";
import { getCurrentTime } from "@/lib/utils/index";
export function useBurnApe({
  data,
  isApe,
  amount,
}: {
  amount: bigint;
  isApe: boolean;
  data:
    | {
        leverageTier: number | undefined;
        debtToken: `0x${string}` | undefined;
        collateralToken: `0x${string}` | undefined;
      }
    | undefined;
}) {
  const { data: burnData, isFetching } = useSimulateContract({
    ...VaultContract,
    functionName: "burn",
    args: [
      isApe,
      {
        debtToken: data?.debtToken ?? "0x",
        leverageTier: data?.leverageTier ?? -1,
        collateralToken: data?.collateralToken ?? "0x",
      },
      amount,
      getCurrentTime() + 10 * 60, // 10 minutes from now
    ],
  });

  return { data: burnData, isFetching };
}
