/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useSimulateContract } from "wagmi";
import { VaultContract } from "@/contracts/vault";
import { useIntervalTimestamp } from "@/components/shared/hooks/useIntervalTimestamp";
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
  const deadline = useIntervalTimestamp();
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
      deadline + 30, // deadline
    ],
  });

  return { data: burnData, isFetching };
}
