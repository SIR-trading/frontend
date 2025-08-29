import { Button } from "@/components/ui/button";
import type { TAddressString } from "@/lib/types";
import type { TUserPosition } from "@/server/queries/vaults";
import { formatUnits, fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { TokenImage } from "@/components/shared/TokenImage";
import { getLeverageRatio } from "@/lib/utils/calculations";
import Show from "@/components/shared/show";
import { useTeaAndApePrice } from "./hooks/useTeaAndApePrice";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";

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
  const teaBalance = formatUnits(teaBal ?? 0n, row.decimals);
  const apeBalance = formatUnits(apeBal ?? 0n, row.decimals);
  const rewards = formatUnits(teaRewards ?? 0n, 12);
  const amount = isApe ? apeBalance : teaBalance;
  
  // Get collateral amount from quoteBurn
  const { data: quoteBurn } = api.vault.quoteBurn.useQuery(
    {
      amount: amount ?? "0",
      isApe,
      debtToken: row.debtToken,
      leverageTier: parseInt(row.leverageTier),
      collateralToken: row.collateralToken,
      decimals: row.decimals,
    },
    {
      enabled: Boolean(amount),
    },
  );
  
  const collateralAmount = formatUnits(quoteBurn ?? 0n, row.decimals);
  
  const positionValue = useTeaAndApePrice({
    isApe,
    amount,
    row,
  });
  
  return (
    <div className="grid grid-cols-[0.8fr_1.5fr_1.2fr_1fr] lg:grid-cols-[0.6fr_0.6fr_1.2fr_1fr_1fr] items-center gap-x-4 py-2 text-left text-foreground">
      <div className="flex items-center gap-x-1 font-normal">
        <span className="">{isApe ? "APE" : "TEA"}</span>
        <span className="text-foreground/70">-</span>
        <span className="text-xl text-accent-100">{getDisplayVaultId(row.vaultId)}</span>
      </div>
      <div className="hidden font-normal lg:block">
        <DisplayFormattedNumber num={isApe ? apeBalance : teaBalance} />
      </div>
      <div className="flex items-center font-normal text-foreground/80">
        {/* Mobile: Show only icons */}
        <div className="flex items-center sm:hidden">
          <TokenImage
            className="rounded-full bg-transparent"
            alt={row.collateralToken}
            address={row.collateralToken}
            width={20}
            height={20}
          />
          <span className="mx-1 text-[12px]">/</span>
          <TokenImage
            className="rounded-full"
            alt={row.debtSymbol}
            address={row.debtToken}
            width={20}
            height={20}
          />
          <sup className="ml-0.5 text-[10px] font-semibold">{getLeverageRatio(Number.parseInt(row.leverageTier))}</sup>
        </div>
        {/* Medium and Large screens: Show icons with text */}
        <div className="hidden items-center sm:flex">
          <TokenImage
            className="rounded-full bg-transparent"
            alt={row.collateralToken}
            address={row.collateralToken}
            width={20}
            height={20}
          />
          <span className="ml-1 text-[14px]">{row.collateralSymbol}</span>
          <span className="mx-1 text-[14px]">/</span>
          <TokenImage
            className="rounded-full"
            alt={row.debtSymbol}
            address={row.debtToken}
            width={20}
            height={20}
          />
          <span className="ml-1 text-[14px]">{row.debtSymbol}</span>
          <sup className="ml-0.5 text-[10px] font-semibold">{getLeverageRatio(Number.parseInt(row.leverageTier))}</sup>
        </div>
      </div>
      <div className="font-normal">
        <div className="flex flex-col">
          <span>
            <DisplayFormattedNumber num={collateralAmount} significant={3} /> {row.collateralSymbol}
          </span>
          <span className="text-[12px] text-foreground/60">
            (<DisplayFormattedNumber num={positionValue} /> USD)
          </span>
        </div>
      </div>
      <div className="flex justify-center">
        {/* Mobile: Dropdown menu */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 border border-foreground/20 bg-secondary hover:bg-primary/20 dark:hover:bg-primary"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-secondary border-foreground/10">
              <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
                <DropdownMenuItem
                  onClick={() => setSelectedRow(true)}
                  disabled={!Number(teaRewards)}
                  className="cursor-pointer hover:bg-primary/20 dark:hover:bg-primary"
                >
                  <span>Claim</span>
                  <span className="ml-2">
                    <DisplayFormattedNumber num={rewards} significant={2} /> SIR
                  </span>
                </DropdownMenuItem>
              </Show>
              <DropdownMenuItem
                onClick={() => setSelectedRow(false)}
                disabled={
                  isApe
                    ? parseFloat(apeBalance) === 0
                    : parseFloat(teaBalance) === 0
                }
                className="cursor-pointer hover:bg-primary/20 dark:hover:bg-primary"
              >
                Burn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Desktop: Regular buttons */}
        <div className="hidden space-x-1 sm:flex">
          <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
            <Button
              onClick={() => {
                setSelectedRow(true);
              }}
              type="button"
              disabled={!Number(teaRewards)}
              className="h-7 rounded-md px-3 text-[12px]"
            >
              <div className="flex items-center">
                <span>Claim</span>
                <span className="hidden pl-1 text-[10px] text-gray-300 lg:inline">
                  <span><DisplayFormattedNumber num={rewards} significant={2} /></span>
                  <span className="pl-[2px]">SIR</span>
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
            className="h-7 rounded-md px-4 text-[12px]"
          >
            Burn
          </Button>
        </div>
      </div>
    </div>
  );
}