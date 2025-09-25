import { Button } from "@/components/ui/button";
import type { TAddressString } from "@/lib/types";
import type { TUserPosition } from "@/server/queries/vaults";
import { formatUnits, fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { TokenImage } from "@/components/shared/TokenImage";
import { getLeverageRatio } from "@/lib/utils/calculations";
import Show from "@/components/shared/show";
import { MoreVertical, Send } from "lucide-react";
import { getSirSymbol } from "@/lib/assets";
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
      enabled: Boolean(amount && amount !== "0"),
    },
  );

  const collateralAmount = formatUnits(quoteBurn ?? 0n, row.decimals);

  // Calculate PnL in collateral terms
  // collateralTotal from subgraph is a raw value that needs decimal formatting
  const depositCollateral = parseFloat(formatUnits(BigInt(row.collateralTotal || "0"), row.decimals));
  const currentCollateral = parseFloat(collateralAmount || "0");
  const pnlCollateral = currentCollateral - depositCollateral;

  // Get debt token decimals from vault data
  const debtDecimals = row.vault?.debtToken?.decimals ?? 18;

  // Get the exchange rate between collateral and debt tokens using Uniswap V3
  const { data: poolData } = api.quote.getMostLiquidPoolPrice.useQuery(
    {
      tokenA: row.collateralToken,
      tokenB: row.debtToken,
      decimalsA: row.decimals,
      decimalsB: debtDecimals,
    },
    {
      enabled: Boolean(row.collateralToken && row.debtToken && currentCollateral > 0),
      staleTime: 60000, // Cache for 1 minute
    }
  );

  // Calculate PnL in debt token terms using current Uniswap V3 price
  // debtTokenTotal from subgraph is a raw value that needs decimal formatting
  const depositDebt = parseFloat(formatUnits(BigInt(row.debtTokenTotal || "0"), debtDecimals));
  let pnlDebt = 0;
  let currentDebtValue = 0;

  if (poolData?.price && currentCollateral > 0) {
    // poolData.price is how many debt tokens per 1 collateral token
    currentDebtValue = currentCollateral * poolData.price;
    pnlDebt = currentDebtValue - depositDebt;
  }

  
  return (
    <div className="grid grid-cols-[0.6fr_1.2fr_1.5fr_0.8fr_0.7fr] md:grid-cols-[0.6fr_0.8fr_1.2fr_1fr_0.8fr_0.7fr] lg:grid-cols-[0.6fr_0.6fr_1fr_0.8fr_0.8fr_0.7fr] items-center gap-x-4 py-2 text-left text-foreground">
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
          <span className="text-sm">
            <DisplayFormattedNumber num={parseFloat(collateralAmount)} significant={3} />
            <span className="text-foreground/60 ml-0.5">{row.collateralSymbol}</span>
          </span>
          <span className="text-xs">
            (<DisplayFormattedNumber num={currentDebtValue} significant={3} />
            <span className="text-foreground/60 ml-0.5">{row.debtSymbol}</span>)
          </span>
        </div>
      </div>
      <div className="font-normal">
        <div className="flex flex-col">
          <span className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}>
            {pnlCollateral >= 0 ? '+' : ''}<DisplayFormattedNumber num={pnlCollateral} significant={3} />
            <span className="text-foreground/60 ml-0.5">{row.collateralSymbol}</span>
          </span>
          <span className={`text-xs ${pnlDebt > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}>
            ({pnlDebt >= 0 ? '+' : ''}<DisplayFormattedNumber num={pnlDebt} significant={3} />
            <span className="text-foreground/60 ml-0.5">{row.debtSymbol}</span>)
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
                className={`h-8 w-8 p-0 border border-foreground/20 bg-secondary hover:bg-primary/20 dark:hover:bg-primary focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 relative ${!isApe && (teaRewards ?? 0n) >= 100000000000000000n ? 'claim-button-gold-glow' : ''}`}
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
                    <DisplayFormattedNumber num={rewards} significant={2} /> {getSirSymbol()}
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
                className={`h-7 w-7 p-0 border border-foreground/20 bg-secondary hover:bg-primary/20 dark:hover:bg-primary focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 relative ${!isApe && (teaRewards ?? 0n) >= 100000000000000000n ? 'claim-button-gold-glow' : ''}`}
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
                    <DisplayFormattedNumber num={rewards} significant={2} /> {getSirSymbol()}
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