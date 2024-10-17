import { Button } from "@/components/ui/button";
import type { TAddressString } from "@/lib/types";
import { getLeverageRatio, formatNumber } from "@/lib/utils";
import type { TUserPosition } from "@/server/queries/vaults";
import { formatUnits } from "viem";
import { useTeaAndApeBals } from "./hooks/useTeaAndApeBals";
import type { ReactNode } from "react";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
interface Props {
  row: TUserPosition;
  isApe: boolean;
  apeAddress?: TAddressString;
  setSelectedRow: (isClaiming: boolean) => void;
}
export function BurnTableRow({
  setSelectedRow,
  row,
  isApe,
  apeAddress,
}: Props) {
  const { apeBal, teaBal } = useTeaAndApeBals({
    apeAddress,
    vaultId: row.vaultId,
    isApe,
  });
  const { address } = useAccount();
  const { data: teaRewards } = api.user.getTeaRewards.useQuery(
    { userAddress: address ?? "0x", vaultId: row.vaultId },
    { enabled: Boolean(address) && !isApe },
  );
  // const rewards = teaRewards ?? 0n;
  // const hasUnclaimedSir = isApe ? false : rewards > 0n;
  const teaBalance = formatUnits(teaBal ?? 0n, row.positionDecimals);
  const apeBalance = formatUnits(apeBal ?? 0n, row.positionDecimals);
  const rewards = formatUnits(teaRewards ?? 0n, 12);
  return (
    <>
      <tr className="hidden grid-cols-6 items-start gap-x-4 py-2 text-left text-white  md:grid">
        <th className="flex items-center gap-x-1 font-normal ">
          <span className="">{isApe ? "APE" : "TEA"}</span>
          <span className="text-gray-500">-</span>
          <span className="text-xl text-accent-100 ">{row.vaultId} </span>
        </th>
        <th className="flex  items-center font-normal text-gray-200">
          {row.debtSymbol}
        </th>
        <th className="font-normal text-gray-200">{row.collateralSymbol}</th>
        <th className="font-normal text-gray-200">
          {getLeverageRatio(parseInt(row.leverageTier))}x
        </th>
        <th className="col-span-2 space-y-3 font-normal">
          <div className="flex items-start  justify-between">
            <span>
              {formatNumber(isApe ? apeBalance : teaBalance, 4)}
              <span className="pl-1 text-[12px] text-gray-400"></span>
            </span>
            <div className="space-x-1">
              {!isApe && (
                <Button
                  onClick={() => setSelectedRow(true)}
                  type="button"
                  disabled={teaRewards === 0n}
                  className="h-7 rounded-full px-5 text-[14px] "
                >
                  Claim{" "}
                  <span className="pl-1 text-[14px] text-gray-300">
                    {formatNumber(rewards, 3)}
                    <span className="pl-[2px] ">SIR</span>
                  </span>
                </Button>
              )}
              <Button
                onClick={() => setSelectedRow(false)}
                disabled={
                  isApe
                    ? parseFloat(apeBalance) === 0
                    : parseFloat(teaBalance) === 0
                }
                type="button"
                className="h-7 w-[65px] rounded-full px-5 py-2 text-[14px] "
              >
                {"Burn"}
              </Button>
            </div>
          </div>

          {/* {!isApe && ( */}
          {/*   <div className="flex justify-between lg:gap-x-8 gap-x-4 items-center"> */}
          {/*     <span> */}
          {/*       {formatNumber(teaBalance, 4)} */}
          {/**/}
          {/*       <span className="text-[12px] text-gray-400 pl-1">SIR</span> */}
          {/*     </span> */}
          {/*   </div> */}
          {/* )} */}
        </th>
      </tr>
      <BurnTableRowMobile
        row={{
          ...row,
        }}
        apeAddress={apeAddress}
        isApe={isApe}
        setSelectedRow={setSelectedRow}
      />
    </>
  );
}
// todo share component
export function BurnTableRowMobile({
  setSelectedRow,
  isApe,
  apeAddress,
  row,
}: Props) {
  const { apeBal, teaBal } = useTeaAndApeBals({
    apeAddress,
    vaultId: row.vaultId,
    isApe,
  });
  const teaBalance = teaBal ?? 0n;
  return (
    <tr className="flex w-full flex-col gap-y-4  rounded-md bg-black/60 p-2 py-2 pb-4  text-[14px]   md:hidden">
      <div className=" justify-center pt-1 font-bold">
        <div className="flex justify-center text-lg">
          <span className="">{isApe ? "APE" : "TEA"}</span>
          <span className="text-gray-500">-</span>
          <span className="text-accent-100  ">{row.vaultId} </span>
        </div>
      </div>
      <MobileTh title={"Long"}>{row.debtSymbol}</MobileTh>
      <MobileTh title={"Versus"}>{row.collateralSymbol}</MobileTh>
      <MobileTh title={"Leverage"}>
        {getLeverageRatio(parseInt(row.leverageTier))}
      </MobileTh>
      <MobileTh title="Balance">
        {isApe ? (
          <span>
            {parseFloat(parseFloat(formatUnits(apeBal ?? 0n, 18)).toFixed(4))}
          </span>
        ) : (
          <span>
            {parseFloat(parseFloat(formatUnits(teaBal ?? 0n, 18)).toFixed(4))}
          </span>
        )}
      </MobileTh>
      <th>
        <Button
          onClick={() => setSelectedRow(false)}
          type="button"
          disabled={teaBalance === 0n}
          className="h-8 rounded-full px-5 py-2 text-[14px] "
        >
          Burn
        </Button>
      </th>
    </tr>
  );
}

function MobileTh({ title, children }: { title: string; children: ReactNode }) {
  return (
    <th className="flex justify-between gap-x-12">
      <h2 className="font-light text-gray-500">{title}</h2>
      {children}
    </th>
  );
}
