import { Button } from "@/components/ui/button";
import type { TAddressString } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import type { TUserPosition } from "@/server/queries/vaults";
import { formatUnits } from "viem";
import { useTeaAndApeBals } from "./hooks/useTeaAndApeBals";
import type { ReactNode } from "react";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getLeverageRatio } from "@/lib/utils/calculations";
import { getLogoAsset } from "@/lib/assets";
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
      <tr className="hidden grid-cols-7 items-start gap-x-4 py-2 text-left text-white  md:grid">
        <th className="flex items-center gap-x-1 font-normal ">
          <span className="">{isApe ? "APE" : "TEA"}</span>
          <span className="text-gray-500">-</span>
          <span className="text-xl text-accent-100 ">{row.vaultId} </span>
        </th>
        <th className="flex  items-center gap-x-1 font-normal text-gray-200">
          <ImageWithFallback
            className="rounded-full bg-transparent"
            alt={row.collateralToken}
            src={getLogoAsset(row.collateralToken)}
            width={20}
            height={20}
          />
          <span className="text-[14px]">{row.collateralSymbol}</span>
        </th>
        <th className="flex items-center gap-x-1 font-normal text-gray-200">
          <ImageWithFallback
            className="rounded-full"
            alt={row.debtSymbol}
            src={getLogoAsset(row.debtToken)}
            width={20}
            height={20}
          />
          <span className="text-[14px]">{row.debtSymbol}</span>
        </th>
        <th className="font-normal text-gray-200">
          {getLeverageRatio(Number.parseInt(row.leverageTier))}x
        </th>
        <th className="col-span-3 space-y-3 font-normal">
          <div className="flex items-start  justify-between">
            <span>
              {formatNumber(isApe ? apeBalance : teaBalance, 3)}
              <span className="pl-1 text-[12px] text-gray-400"></span>
            </span>
            <div className="space-x-1">
              {!isApe && (
                <Button
                  onClick={() => {
                    setSelectedRow(true);
                  }}
                  type="button"
                  disabled={teaRewards === 0n}
                  className="h-7 rounded-full px-5 text-[14px] "
                >
                  <div>
                    <span>Claim</span>
                    <span className="pl-1 text-[12px] text-gray-300">
                      <span>{formatNumber(rewards, 2)}</span>
                      <span className="pl-[2px] ">SIR</span>
                    </span>
                  </div>
                </Button>
              )}
              <Button
                onClick={() => {
                  setSelectedRow(false);
                }}
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
        </th>
      </tr>
      <BurnTableRowMobile
        apeBalance={apeBalance}
        teaBalance={teaBalance}
        rewards={rewards}
        row={{
          ...row,
        }}
        teaRewards={teaRewards}
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
  row,
  teaRewards,
  rewards,
  teaBalance,
  apeBalance,
}: Props & {
  teaRewards: bigint | undefined;
  rewards: string;
  apeBalance: string;
  teaBalance: string;
}) {
  return (
    <tr className="flex w-full flex-col gap-y-4  rounded-md bg-secondary p-2 py-2 pb-4  text-[14px]   md:hidden">
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
        {isApe ? <span>{teaBalance}</span> : <span>{apeBalance}</span>}
      </MobileTh>
      <th>
        <div className="space-x-1">
          {!isApe && (
            <Button
              onClick={() => setSelectedRow(true)}
              type="button"
              disabled={teaRewards === 0n}
              className="h-7 rounded-full px-5 text-[14px] "
            >
              <div>
                <span>Claim</span>
                <span className="pl-1 text-[12px] text-gray-300">
                  <span>{formatNumber(rewards, 2)}</span>
                  <span className="pl-[2px] ">SIR</span>
                </span>
              </div>
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
        {/**/}
        {/* <Button */}
        {/*   onClick={() => setSelectedRow(false)} */}
        {/*   type="button" */}
        {/*   disabled={teaBalance === 0n} */}
        {/*   className="h-8 rounded-full px-5 py-2 text-[14px] " */}
        {/* > */}
        {/*   Burn */}
        {/* </Button> */}
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
