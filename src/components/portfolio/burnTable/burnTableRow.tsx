import { Button } from "@/components/ui/button";
import type { TAddressString } from "@/lib/types";
import type { TUserPosition } from "@/server/queries/vaults";
import { formatUnits, fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import type { ReactNode } from "react";
import { TokenImage } from "@/components/shared/TokenImage";
import { getLeverageRatio } from "@/lib/utils/calculations";
import Show from "@/components/shared/show";
import { useTeaAndApePrice } from "./hooks/useTeaAndApePrice";

interface Props {
  row: TUserPosition;
  isApe: boolean;
  apeAddress?: TAddressString;
  setSelectedRow: (isClaiming: boolean) => void;
}

// Helper function to convert vaultId to consistent decimal format
const getDisplayVaultId = (vaultId: string): string => {
  // If vaultId starts with '0x', it's hexadecimal and needs conversion
  if (vaultId.startsWith('0x')) {
    try {
      return fromHex(vaultId as `0x${string}`, "number").toString();
    } catch {
      // If conversion fails, return as-is
      return vaultId;
    }
  }
  // If it's already a decimal number, return as-is
  return vaultId;
};
export function BurnTableRow({
  setSelectedRow,
  row,
  isApe,
  apeAddress,
  teaBal,
  apeBal,
  teaRewards,
}: Props & {
  teaBal: bigint | undefined;
  apeBal: bigint | undefined;
  teaRewards: bigint | undefined;
}) {
  // const { apeBal, teaBal } = useTeaAndApeBals({
  //   apeAddress,
  //   vaultId: row.vaultId,
  //   isApe,
  // });
  // const { address } = useAccount();
  // const { data: teaRewards } = api.user.getTeaRewards.useQuery(
  //   { userAddress: address ?? "0x", vaultId: row.vaultId },
  //   { enabled: Boolean(address) && !isApe },
  // );

  // const rewards = teaRewards ?? 0n;
  // const hasUnclaimedSir = isApe ? false : rewards > 0n;
  const teaBalance = formatUnits(teaBal ?? 0n, row.decimals);
  const apeBalance = formatUnits(apeBal ?? 0n, row.decimals);
  const rewards = formatUnits(teaRewards ?? 0n, 12);
  const positionValue = useTeaAndApePrice({
    isApe,
    amount: isApe ? apeBalance : teaBalance,
    row,
  });
  return (
    <>
      <div className="hidden grid-cols-7 items-start gap-x-4 py-2 text-left text-foreground  md:grid">
        <div className="flex items-center gap-x-1 font-normal ">
          <span className="">{isApe ? "APE" : "TEA"}</span>
          <span className="text-foreground/70">-</span>
          <span className="text-xl text-accent-100 ">{getDisplayVaultId(row.vaultId)} </span>
        </div>
        <div className="flex  items-center gap-x-1 font-normal text-foreground/80">
          <TokenImage
            className="rounded-full bg-transparent"
            alt={row.collateralToken}
            address={row.collateralToken}
            width={20}
            height={20}
          />
          <span className="text-[14px]">{row.collateralSymbol}</span>
        </div>
        <div className="flex items-center gap-x-1 font-normal text-foreground/80">
          <TokenImage
            className="rounded-full"
            alt={row.debtSymbol}
            address={row.debtToken}
            width={20}
            height={20}
          />
          <span className="text-[14px]">{row.debtSymbol}</span>
        </div>
        <div className="font-normal text-foreground/80">
          ^{getLeverageRatio(Number.parseInt(row.leverageTier))}
        </div>
        <div className="col-span-3 space-y-3 font-normal">
          <div className="flex items-start  justify-between">
            <span>
              <DisplayFormattedNumber
                num={isApe ? apeBalance : teaBalance}
              />
              <span className="ml-1 italic text-foreground/70">
                ($<DisplayFormattedNumber num={positionValue} />)
              </span>
              <span className="text-gray-400 pl-1 text-[12px]"></span>
            </span>
            <div className="space-x-1">
              <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
                <Button
                  onClick={() => {
                    setSelectedRow(true);
                  }}
                  type="button"
                  disabled={!Number(teaRewards)}
                  className="h-7 rounded-full px-5 text-[14px] "
                >
                  <div>
                    <span>Claim</span>
                    <span className="text-gray-300 pl-1 text-[12px]">
                      <span><DisplayFormattedNumber num={rewards} significant={2} /></span>
                      <span className="pl-[2px] ">SIR</span>
                    </span>
                  </div>
                </Button>
              </Show>
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
        </div>
      </div>
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
      <td className=" justify-center pt-1 font-bold">
        <div className="flex justify-center text-lg">
          <span className="">{isApe ? "APE" : "TEA"}</span>
          <span className="text-foreground/70">-</span>
          <span className="text-accent-100  ">{getDisplayVaultId(row.vaultId)} </span>
        </div>
      </td>
      <MobileTh title={"Long"}>{row.collateralSymbol}</MobileTh>
      <MobileTh title={"Versus"}>{row.debtSymbol}</MobileTh>
      <MobileTh title={"Leverage"}>
        {getLeverageRatio(parseInt(row.leverageTier))}
      </MobileTh>
      <MobileTh title="Balance">
        {isApe ? <span>{teaBalance}</span> : <span>{apeBalance}</span>}
      </MobileTh>
      <td>
        <div className="space-x-1">
          <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
            <Button
              onClick={() => setSelectedRow(true)}
              type="button"
              disabled={!Number(teaRewards)}
              className="h-7 rounded-full px-5 text-[14px] "
            >
              <div>
                <span>Claim</span>
                <span className="text-gray-300 pl-1 text-[12px]">
                  <span>
                    <DisplayFormattedNumber num={rewards} significant={2} />
                  </span>
                  <span className="pl-[2px] ">SIR</span>
                </span>
              </div>
            </Button>
          </Show>
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
      </td>
    </tr>
  );
}

function MobileTh({ title, children }: { title: string; children: ReactNode }) {
  return (
    <td className="flex justify-between gap-x-12">
      <h2 className="font-light text-foreground/70">{title}</h2>
      {children}
    </td>
  );
}
