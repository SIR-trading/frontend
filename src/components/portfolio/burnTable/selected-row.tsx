import type { TAddressString } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import BurnForm from "../burnForm/burnForm";
import type { TUserPosition } from "@/server/queries/vaults";
import { useTeaAndApeBals } from "./hooks/useTeaAndApeBals";
import { formatEther, formatUnits } from "viem";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import { useEffect } from "react";
import { getLeverageRatio } from "@/lib/utils/calculations";

export default function SelectedRow({
  params,
  close,
  apeAddress,
  isApe,
  isClaiming,
}: {
  params: TUserPosition;
  apeAddress?: TAddressString;
  isApe: boolean;
  isClaiming: boolean;
  close: () => void;
}) {
  const { apeBal, teaBal } = useTeaAndApeBals({
    vaultId: params.vaultId,
    apeAddress,
    isApe,
  });
  const { address } = useAccount();
  const { data: teaRewards } = api.user.getTeaRewards.useQuery(
    { userAddress: address ?? "0x", vaultId: params.vaultId },
    { enabled: Boolean(address) && !isApe },
  );
  const atBal = isApe ? apeBal : teaBal;
  if (!params) {
    <div>
      <h1>Hello</h1>
    </div>;
  }
  console.log(atBal, "atBal");
  useEffect(() => {
    if (atBal === undefined) {
      close();
    }
  }, [atBal]);
  if (atBal === undefined) {
    return;
  }
  const balance = isClaiming
    ? formatUnits(teaRewards ?? 0n, 12)
    : formatEther(atBal);

  return (
    <div className="animate-fade-in">
      <div className="hidden flex-col  gap-y-4 pb-4 md:flex">
        <tr className=" hidden grid-cols-5 gap-x-4 border-b border-white border-opacity-10 pb-1 text-left text-[14px] font-thin  text-gray-500 md:grid">
          <th className="font-normal">Token</th>
          <th className="font-normal">Long</th>
          <th className="font-normal">Versus</th>
          <th className="font-normal">Leverage ratio</th>
          <th className="flex justify-end font-normal">Balance</th>
        </tr>
        {/* <BurnTableHeaders /> */}
        <tr className="relative grid h-8 grid-cols-5 items-center gap-x-4 text-left text-white">
          <th className="flex items-center gap-x-1 font-normal ">
            <span className="">{isApe ? "APE" : "TEA"}</span>
            <span className="text-gray-500">-</span>
            <span className="text-xl text-accent-100 ">{params.vaultId} </span>
          </th>
          <th className="font-normal">{params?.debtSymbol}</th>
          <th className="font-normal">{params?.collateralSymbol}</th>
          <th className="font-normal">
            {getLeverageRatio(parseInt(params?.leverageTier ?? "0"))}x
          </th>
          <th className="flex  items-center justify-end font-normal ">
            <h2 className="flex h-8 items-center space-x-1">
              <span className="">{formatNumber(balance, 6)}</span>
              <span className="text-[14px] text-gray-500">
                {isClaiming ? "SIR" : ""}
              </span>
            </h2>
          </th>
        </tr>
      </div>
      <div className="flex justify-center pt-4">
        <div
          id="burn-form"
          className="justify-between rounded-lg border border-secondary-700 bg-secondary p-4"
        >
          <BurnForm
            isClaiming={isClaiming}
            teaRewardBalance={teaRewards}
            levTier={params.leverageTier}
            close={close}
            isApe={isApe}
            balance={atBal}
            row={params}
          />
        </div>
      </div>
    </div>
  );
}
