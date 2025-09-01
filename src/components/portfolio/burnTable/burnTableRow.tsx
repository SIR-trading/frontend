import { Button } from "@/components/ui/button";
import type { TAddressString } from "@/lib/types";
import type { TUserPosition } from "@/server/queries/vaults";
import { formatUnits, fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { TokenImage } from "@/components/shared/TokenImage";
import { getLeverageRatio } from "@/lib/utils/calculations";
import Show from "@/components/shared/show";
import { useTeaAndApePrice } from "./hooks/useTeaAndApePrice";
import { MoreVertical, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { api } from "@/trpc/react";
import { useState } from "react";

interface Props {
  row: TUserPosition;
  isApe: boolean;
  apeAddress?: TAddressString;
  setSelectedRow: (mode: "burn" | "claim" | "transfer") => void;
}

// Helper function to convert vaultId to consistent decimal format
const getDisplayVaultId = (vaultId: string | undefined): string => {
  if (!vaultId) return "";
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
  apeAddress: _apeAddress,
  teaBal,
  apeBal,
  teaRewards,
}: Props & {
  teaBal: bigint | undefined;
  apeBal: bigint | undefined;
  teaRewards: bigint | undefined;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenLg, setDropdownOpenLg] = useState(false);
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
    <div className="grid grid-cols-[0.6fr_1.2fr_1.5fr_0.7fr] md:grid-cols-[0.6fr_0.8fr_1.2fr_1fr_0.7fr] lg:grid-cols-[0.6fr_0.6fr_1.2fr_1fr_0.7fr] items-center gap-x-4 py-2 text-left text-foreground">
      <div className="flex items-center gap-x-1 font-normal">
        <span className="">{isApe ? "APE" : "TEA"}</span>
        <span className="text-foreground/70">-</span>
        <span className="text-xl text-accent-100">{getDisplayVaultId(row.vaultId)}</span>
      </div>
      <div className="hidden font-normal md:block">
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
        {/* Small and Medium screens: Dropdown menu for all actions */}
        <div className="lg:hidden">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-8 p-0 border border-foreground/20 bg-secondary hover:bg-primary/20 dark:hover:bg-primary focus:outline-none focus:ring-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-secondary border-foreground/10">
              <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
                <DropdownMenuItem
                  onClick={() => setSelectedRow("claim")}
                  disabled={!Number(teaRewards)}
                  className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                >
                  <span>Claim</span>
                  <span className="text-gray-300">
                    <DisplayFormattedNumber num={rewards} significant={2} /> SIR
                  </span>
                </DropdownMenuItem>
              </Show>
              <DropdownMenuItem
                onClick={() => setSelectedRow("burn")}
                disabled={
                  isApe
                    ? parseFloat(apeBalance) === 0
                    : parseFloat(teaBalance) === 0
                }
                className="cursor-pointer hover:bg-primary/20 dark:hover:bg-primary"
              >
                Burn
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/10" />
              <DropdownMenuItem
                onClick={() => {
                  setDropdownOpen(false);
                  setTimeout(() => setSelectedRow("transfer"), 100);
                }}
                disabled={
                  isApe
                    ? parseFloat(apeBalance) === 0
                    : parseFloat(teaBalance) === 0
                }
                className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
              >
                <Send className="mr-2 h-3 w-3" />
                Transfer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Large screens: Burn button + More dropdown */}
        <div className="hidden lg:flex justify-center space-x-1">
          <Button
            onClick={() => {
              setSelectedRow("burn");
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
          {/* More dropdown for additional actions */}
          <DropdownMenu open={dropdownOpenLg} onOpenChange={setDropdownOpenLg}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-7 w-7 p-0 border border-foreground/20 bg-secondary hover:bg-primary/20 dark:hover:bg-primary focus:outline-none focus:ring-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-secondary border-foreground/10">
              <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpenLg(false);
                    setTimeout(() => setSelectedRow("claim"), 100);
                  }}
                  disabled={!Number(teaRewards)}
                  className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                >
                  <span>Claim</span>
                  <span className="text-gray-300">
                    <DisplayFormattedNumber num={rewards} significant={2} /> SIR
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground/10" />
              </Show>
              <DropdownMenuItem
                onClick={() => {
                  setDropdownOpenLg(false);
                  setTimeout(() => setSelectedRow("transfer"), 100);
                }}
                disabled={
                  isApe
                    ? parseFloat(apeBalance) === 0
                    : parseFloat(teaBalance) === 0
                }
                className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
              >
                <Send className="mr-2 h-3 w-3" />
                Transfer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}