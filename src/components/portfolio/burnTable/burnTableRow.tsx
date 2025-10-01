"use client";
import React, { useState } from "react";
import Show from "@/components/shared/show";
import { Button } from "@/components/ui/button";
import { TokenImage } from "@/components/shared/TokenImage";
import { getSirSymbol } from "@/lib/assets";
import { api } from "@/trpc/react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatUnits } from "viem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Send, ChevronDown, ChevronUp } from "lucide-react";
import HoverPopupMobile from "@/components/ui/hover-popup-mobile";
import { parseUnits } from "viem";
import { useVaultData } from "@/contexts/VaultDataContext";
import {
  calculatePriceIncreaseToTarget,
  calculateBreakevenTime,
} from "@/lib/utils/breakeven";
import { PriceIncreaseDisplay } from "./PriceIncreaseDisplay";
import { TimeDisplay } from "./TimeDisplay";
import type { TUserPosition } from "@/server/queries/vaults";
import { TwitterIcon } from "@/components/ui/icons/twitter-icon";
import { SharePositionModal } from "./SharePositionModal";

export function BurnTableRow({
  row,
  isApe,
  setSelectedRow,
  apeAddress: _apeAddress,
  teaBal,
  apeBal,
  teaRewards,
}: {
  row: TUserPosition;
  isApe: boolean;
  setSelectedRow: (mode: "burn" | "claim" | "transfer") => void;
  apeAddress?: string;
  teaBal?: bigint;
  apeBal?: bigint;
  teaRewards?: bigint;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenLg, setDropdownOpenLg] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Get vault data from context to get the rate for TEA rewards
  const { getVaultById } = useVaultData();
  const vaultData = !isApe ? getVaultById(row.vaultId) : undefined;

  // Get current token balance (APE/TEA tokens have their own decimals)
  const currentBalance = isApe ? apeBal : teaBal;
  const tokenDecimals = row.decimals; // This is APE/TEA token decimals
  const balanceString = formatUnits(currentBalance ?? 0n, tokenDecimals);

  // Get current collateral value from quoteBurn
  const { data: quoteBurn } = api.vault.quoteBurn.useQuery(
    {
      amount: balanceString,
      collateralToken: row.collateralToken,
      debtToken: row.debtToken,
      isApe,
      leverageTier: parseInt(row.leverageTier),
      decimals: tokenDecimals,
    },
    {
      staleTime: 1000 * 10,
      enabled: Boolean(currentBalance && currentBalance > 0n),
    },
  );

  // Current collateral amount (what you'd get if you burn now)
  const currentCollateralAmount = quoteBurn
    ? formatUnits(quoteBurn, row.vault.collateralToken.decimals)
    : "0";
  const currentCollateral = parseFloat(currentCollateralAmount);

  // Exchange rate from the API (how many debt tokens per 1 collateral token)
  const { data: exchangeRateData } = api.quote.getMostLiquidPoolPrice.useQuery(
    {
      tokenA: row.collateralToken,
      tokenB: row.debtToken,
      decimalsA: row.vault.collateralToken.decimals,
      decimalsB: row.vault.debtToken.decimals,
    },
    {
      staleTime: 1000 * 60, // Cache for 1 minute
      enabled: Boolean(row.collateralToken && row.debtToken),
    },
  );

  // Calculate current debt token value
  // exchangeRateData.price = debt tokens per 1 collateral token
  const currentDebtTokenValue = exchangeRateData?.price
    ? currentCollateral * exchangeRateData.price
    : 0;

  // Initial values from subgraph (need to scale down by decimals)
  const initialCollateral = parseFloat(
    formatUnits(
      BigInt(row.collateralTotal),
      row.vault.collateralToken.decimals,
    ),
  );
  const initialDebtTokenValue = parseFloat(
    formatUnits(BigInt(row.debtTokenTotal), row.vault.debtToken.decimals),
  );

  // Calculate PnL (current value - initial value)
  const pnlCollateral = currentCollateral - initialCollateral;
  const pnlDebtToken = currentDebtTokenValue - initialDebtTokenValue;

  const apeBalance = formatUnits(apeBal ?? 0n, tokenDecimals);
  const teaBalance = formatUnits(teaBal ?? 0n, tokenDecimals);

  const rewards = Number(formatUnits(teaRewards ?? 0n, 12)); // SIR always has 12 decimals

  const getDisplayVaultId = (vaultId: string) => {
    // Convert hex string to number if it starts with 0x, otherwise use as-is
    if (vaultId.startsWith("0x")) {
      return parseInt(vaultId, 16).toString();
    }
    return vaultId;
  };

  const getLeverageRatio = (leverageTier: number) => {
    const leverage = 1 + Math.pow(2, leverageTier);
    return `${leverage}`;
  };

  // Calculate break-even metrics
  let breakevenTimeDays: number | null = null; // For TEA tokens (time-based)

  // Calculate price increase targets for APE tokens
  const priceIncreaseTargets = {
    breakeven: {
      collateral: null as number | null,
      debtToken: null as number | null,
    },
    double: {
      collateral: null as number | null,
      debtToken: null as number | null,
    },
    tenx: {
      collateral: null as number | null,
      debtToken: null as number | null,
    },
  };

  if (isApe) {
    // Calculate leverage from leverage tier
    const leverageTier = parseInt(row.leverageTier);
    const leverage = 1 + Math.pow(2, leverageTier);

    // Break-even: target = initial value
    priceIncreaseTargets.breakeven.collateral = calculatePriceIncreaseToTarget(
      initialCollateral,
      currentCollateral,
      leverage,
      true, // isCollateral
    );

    priceIncreaseTargets.breakeven.debtToken = calculatePriceIncreaseToTarget(
      initialDebtTokenValue,
      currentDebtTokenValue,
      leverage,
      false, // isDebtToken
    );

    // 2x: target = 2 * initial value
    priceIncreaseTargets.double.collateral = calculatePriceIncreaseToTarget(
      initialCollateral * 2,
      currentCollateral,
      leverage,
      true,
    );

    priceIncreaseTargets.double.debtToken = calculatePriceIncreaseToTarget(
      initialDebtTokenValue * 2,
      currentDebtTokenValue,
      leverage,
      false,
    );

    // 10x: target = 10 * initial value
    priceIncreaseTargets.tenx.collateral = calculatePriceIncreaseToTarget(
      initialCollateral * 10,
      currentCollateral,
      leverage,
      true,
    );

    priceIncreaseTargets.tenx.debtToken = calculatePriceIncreaseToTarget(
      initialDebtTokenValue * 10,
      currentDebtTokenValue,
      leverage,
      false,
    );
  } else {
    // For TEA tokens: calculate break-even time
    const { data: apyData } = api.vault.getVaultApy.useQuery(
      { vaultId: row.vaultId },
      {
        enabled: Boolean(row.vaultId),
        staleTime: 60000, // Cache for 1 minute
      },
    );

    if (apyData?.apy !== undefined) {
      if (currentCollateral >= initialCollateral) {
        // Already at or above break-even
        breakevenTimeDays = 0;
      } else if (apyData.apy > 0) {
        breakevenTimeDays = calculateBreakevenTime(
          initialCollateral,
          currentCollateral,
          apyData.apy,
        );
      }
      // If APY is 0 and not at break-even, breakevenTimeDays stays null
      // which will be handled later as infinite
    }
  }

  // Calculate time targets for TEA tokens (collateral and debt token) - store as days
  let doubleTimeDays: number | null = null;
  let tenxTimeDays: number | null = null;
  let breakevenDebtTimeDays: number | null = null;
  let doubleDebtTimeDays: number | null = null;
  let tenxDebtTimeDays: number | null = null;

  // Special flag for when APY is 0 (infinite time)
  let isInfiniteTime = false;

  if (!isApe) {
    const { data: apyData } = api.vault.getVaultApy.useQuery(
      { vaultId: row.vaultId },
      {
        enabled: Boolean(row.vaultId),
        staleTime: 60000, // Cache for 1 minute
      },
    );

    if (apyData?.apy !== undefined) {
      // Check if targets are already achieved (current >= target)
      // If so, set time to 0 (which will display as checkmark)

      // For collateral targets
      if (currentCollateral >= initialCollateral) {
        // Break-even already achieved for collateral
        breakevenTimeDays = 0;
      } else if (apyData.apy === 0) {
        isInfiniteTime = true;
      } else {
        breakevenTimeDays = calculateBreakevenTime(
          initialCollateral,
          currentCollateral,
          apyData.apy,
        );
      }

      if (currentCollateral >= initialCollateral * 2) {
        // 2x already achieved for collateral
        doubleTimeDays = 0;
      } else if (apyData.apy === 0) {
        // Only set infinite if not already achieved
        isInfiniteTime = true;
      } else {
        doubleTimeDays = calculateBreakevenTime(
          initialCollateral * 2,
          currentCollateral,
          apyData.apy,
        );
      }

      if (currentCollateral >= initialCollateral * 10) {
        // 10x already achieved for collateral
        tenxTimeDays = 0;
      } else if (apyData.apy === 0) {
        isInfiniteTime = true;
      } else {
        tenxTimeDays = calculateBreakevenTime(
          initialCollateral * 10,
          currentCollateral,
          apyData.apy,
        );
      }

      // For debt token targets
      if (currentDebtTokenValue >= initialDebtTokenValue) {
        // Break-even already achieved for debt token
        breakevenDebtTimeDays = 0;
      } else if (apyData.apy === 0) {
        // Only set infinite if not already achieved
        // Note: isInfiniteTime already set above if APY is 0
      } else {
        breakevenDebtTimeDays = calculateBreakevenTime(
          initialDebtTokenValue,
          currentDebtTokenValue,
          apyData.apy,
        );
      }

      if (currentDebtTokenValue >= initialDebtTokenValue * 2) {
        // 2x already achieved for debt token
        doubleDebtTimeDays = 0;
      } else if (apyData.apy === 0) {
        // Only set infinite if not already achieved
      } else {
        doubleDebtTimeDays = calculateBreakevenTime(
          initialDebtTokenValue * 2,
          currentDebtTokenValue,
          apyData.apy,
        );
      }

      if (currentDebtTokenValue >= initialDebtTokenValue * 10) {
        // 10x already achieved for debt token
        tenxDebtTimeDays = 0;
      } else if (apyData.apy === 0) {
        // Only set infinite if not already achieved
      } else {
        tenxDebtTimeDays = calculateBreakevenTime(
          initialDebtTokenValue * 10,
          currentDebtTokenValue,
          apyData.apy,
        );
      }
    }
  }

  // Render content based on position type
  const content = isApe ? (
    <>
        {/* First row - collateral values */}
        <tr className="text-left text-foreground">
          {/* Token column - spans 2 rows */}
          <td rowSpan={2} className="py-2 pr-4 font-normal">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-1">
                <span className="">APE</span>
                <span className="text-foreground/70">-</span>
                <span className="text-xl text-accent-100">
                  {getDisplayVaultId(row.vaultId)}
                </span>
              </div>
              {/* Expand button for mobile */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded p-1 transition-colors hover:bg-foreground/10 md:hidden"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-foreground/60" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-foreground/60" />
                )}
              </button>
            </div>
          </td>

          {/* Vault column - spans 2 rows */}
          <td rowSpan={2} className="py-2 pr-4 font-normal text-foreground/80">
            <div className="flex items-center">
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
                <sup className="ml-0.5 text-[10px] font-semibold">
                  {getLeverageRatio(Number.parseInt(row.leverageTier))}
                </sup>
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
                <sup className="ml-0.5 text-[10px] font-semibold">
                  {getLeverageRatio(Number.parseInt(row.leverageTier))}
                </sup>
              </div>
            </div>
          </td>

          {/* Value column - collateral */}
          <td className="pb-0.5 pr-4 pt-1.5 text-right font-normal">
            <span className="text-sm">
              <DisplayFormattedNumber num={currentCollateral} significant={3} />
              <span className="ml-0.5 text-foreground/60">
                {row.collateralSymbol}
              </span>
            </span>
          </td>

          {/* PnL column - collateral */}
          <td className="relative pb-0.5 pr-4 pt-1.5 text-right font-normal">
            <span
              className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
            >
              {pnlCollateral >= 0 ? "+" : ""}
              <DisplayFormattedNumber num={pnlCollateral} significant={3} />
              <span className="ml-0.5 text-foreground/60">
                {row.collateralSymbol}
              </span>
            </span>
            {/* Floating emoji for profitable positions - positioned between rows */}
            {pnlCollateral >= 0 && (
              <HoverPopupMobile
                size="200"
                trigger={
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="absolute -right-2 bottom-[-8px] z-10 animate-[pulse_2s_ease-in-out_infinite] cursor-pointer transition-transform hover:scale-125"
                  >
                    {(() => {
                      const percentGain =
                        initialCollateral > 0
                          ? (pnlCollateral / initialCollateral) * 100
                          : 0;

                      if (percentGain >= 200) return "🚀"; // 200%+ gains - rocket
                      if (percentGain >= 100) return "💎"; // 100-200% gains - diamond hands
                      if (percentGain >= 50) return "🔥"; // 50-100% gains - fire
                      if (percentGain >= 20) return "⚡"; // 20-50% gains - lightning
                      return "✨"; // 0-20% gains - sparkles
                    })()}
                  </button>
                }
              >
                <span className="text-[13px] font-medium">
                  Tweet about your {(() => {
                    const percentGain = initialCollateral > 0
                      ? (pnlCollateral / initialCollateral) * 100
                      : 0;
                    return percentGain >= 1
                      ? `${percentGain.toFixed(0)}%`
                      : `${percentGain.toFixed(1)}%`;
                  })()} {row.collateralSymbol} gains! 🎉
                </span>
              </HoverPopupMobile>
            )}
          </td>

          {/* Break-even column - collateral */}
          <td className="hidden pb-0.5 pr-2 pt-1.5 text-right font-normal md:table-cell">
            <PriceIncreaseDisplay
              percentage={priceIncreaseTargets.breakeven.collateral}
              className={`text-xs ${priceIncreaseTargets.breakeven.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
            />
          </td>

          {/* 2x column - collateral */}
          <td className="hidden pb-0.5 pr-2 pt-1.5 text-right font-normal md:table-cell">
            <PriceIncreaseDisplay
              percentage={priceIncreaseTargets.double.collateral}
              className={`text-xs ${priceIncreaseTargets.double.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
            />
          </td>

          {/* 10x column - collateral */}
          <td className="hidden pb-0.5 pr-4 pt-1.5 text-right font-normal md:table-cell">
            <PriceIncreaseDisplay
              percentage={priceIncreaseTargets.tenx.collateral}
              className={`text-xs ${priceIncreaseTargets.tenx.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
            />
          </td>

          {/* Actions column - spans 2 rows */}
          <td rowSpan={2} className="py-2 text-center">
            {/* Small and Medium screens: Dropdown menu for all actions */}
            <div className="lg:hidden">
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`relative h-8 w-8 border border-foreground/20 bg-secondary p-0 hover:bg-primary/20 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:hover:bg-primary ${!isApe && (teaRewards ?? 0n) >= 100000000000000000n ? "claim-button-gold-glow" : ""}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-foreground/10 bg-secondary"
                >
                  {/* Share option - only show if position has reached break-even */}
                  <Show when={pnlCollateral >= 0}>
                    <DropdownMenuItem
                      onClick={() => {
                        setDropdownOpen(false);
                        setShareModalOpen(true);
                      }}
                      className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                    >
                      <TwitterIcon className="mr-2 h-3 w-3" />
                      Share Gains
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-foreground/10" />
                  </Show>
                  <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
                    <DropdownMenuItem
                      onClick={() => setSelectedRow("claim")}
                      disabled={!Number(teaRewards)}
                      className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                    >
                      <span>Claim</span>
                      <span className="text-gray-300">
                        <DisplayFormattedNumber num={rewards} significant={2} />{" "}
                        {getSirSymbol()}
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
                    Close
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

            {/* Large screens: Close button + More dropdown */}
            <div className="hidden justify-center space-x-1 lg:flex">
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
                className="h-7 rounded-md px-3 text-[12px]"
              >
                Close
              </Button>
              {/* More dropdown for additional actions */}
              <DropdownMenu
                open={dropdownOpenLg}
                onOpenChange={setDropdownOpenLg}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`relative h-7 w-7 border border-foreground/20 bg-secondary p-0 hover:bg-primary/20 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:hover:bg-primary ${!isApe && (teaRewards ?? 0n) >= 100000000000000000n ? "claim-button-gold-glow" : ""}`}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-foreground/10 bg-secondary"
                >
                  {/* Share option - only show if position has reached break-even */}
                  <Show when={pnlCollateral >= 0}>
                    <DropdownMenuItem
                      onClick={() => {
                        setDropdownOpenLg(false);
                        setShareModalOpen(true);
                      }}
                      className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                    >
                      <TwitterIcon className="mr-2 h-3 w-3" />
                      Share Gains
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-foreground/10" />
                  </Show>
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
                        <DisplayFormattedNumber num={rewards} significant={2} />{" "}
                        {getSirSymbol()}
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
          </td>
        </tr>

        {/* Second row - debt token values */}
        <tr className="border-b border-foreground/5 text-left text-foreground">
          {/* Value column - debt token */}
          <td className="pb-1.5 pr-4 pt-0.5 text-right font-normal">
            <span className="text-sm">
              <DisplayFormattedNumber
                num={currentDebtTokenValue}
                significant={3}
              />
              <span className="ml-0.5 text-foreground/60">
                {row.debtSymbol}
              </span>
            </span>
          </td>

          {/* PnL column - debt token */}
          <td className="pb-1.5 pr-4 pt-0.5 text-right font-normal">
            <span
              className={`text-sm ${pnlDebtToken > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
            >
              {pnlDebtToken >= 0 ? "+" : ""}
              <DisplayFormattedNumber num={pnlDebtToken} significant={3} />
              <span className="ml-0.5 text-foreground/60">
                {row.debtSymbol}
              </span>
            </span>
          </td>

          {/* Break-even column - debt token */}
          <td className="hidden pb-1.5 pr-2 pt-0.5 text-right font-normal md:table-cell">
            {priceIncreaseTargets.breakeven.debtToken !== null && (
              <PriceIncreaseDisplay
                percentage={priceIncreaseTargets.breakeven.debtToken}
                className={`text-xs ${priceIncreaseTargets.breakeven.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              />
            )}
          </td>

          {/* 2x column - debt token */}
          <td className="hidden pb-1.5 pr-2 pt-0.5 text-right font-normal md:table-cell">
            {priceIncreaseTargets.double.debtToken !== null && (
              <PriceIncreaseDisplay
                percentage={priceIncreaseTargets.double.debtToken}
                className={`text-xs ${priceIncreaseTargets.double.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              />
            )}
          </td>

          {/* 10x column - debt token */}
          <td className="hidden pb-1.5 pr-4 pt-0.5 text-right font-normal md:table-cell">
            {priceIncreaseTargets.tenx.debtToken !== null && (
              <PriceIncreaseDisplay
                percentage={priceIncreaseTargets.tenx.debtToken}
                className={`text-xs ${priceIncreaseTargets.tenx.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              />
            )}
          </td>
        </tr>

        {/* Expanded row for mobile - shows hidden columns */}
        {isExpanded && (
          <tr className="border-b border-foreground/5 bg-foreground/5 md:hidden">
            <td colSpan={7} className="px-4 py-3">
              <div className="space-y-3">
                {/* Collateral Required Price Gain */}
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">
                    Required Price Gain ({row.collateralSymbol})
                  </span>
                  <div className="space-x-4 text-right">
                    <span className="inline-block min-w-[50px]">
                      <span className="text-xs text-foreground/40">B/E: </span>
                      <PriceIncreaseDisplay
                        percentage={priceIncreaseTargets.breakeven.collateral}
                        className={`text-xs ${priceIncreaseTargets.breakeven.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                      />
                    </span>
                    <span className="inline-block min-w-[50px]">
                      <span className="text-xs text-foreground/40">2x: </span>
                      <PriceIncreaseDisplay
                        percentage={priceIncreaseTargets.double.collateral}
                        className={`text-xs ${priceIncreaseTargets.double.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                      />
                    </span>
                    <span className="inline-block min-w-[50px]">
                      <span className="text-xs text-foreground/40">10x: </span>
                      <PriceIncreaseDisplay
                        percentage={priceIncreaseTargets.tenx.collateral}
                        className={`text-xs ${priceIncreaseTargets.tenx.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                      />
                    </span>
                  </div>
                </div>

                {/* Debt Token Required Price Gain */}
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">
                    Required Price Gain ({row.debtSymbol})
                  </span>
                  <div className="space-x-4 text-right">
                    <span className="inline-block min-w-[50px]">
                      <span className="text-xs text-foreground/40">B/E: </span>
                      {priceIncreaseTargets.breakeven.debtToken !== null && (
                        <PriceIncreaseDisplay
                          percentage={priceIncreaseTargets.breakeven.debtToken}
                          className={`text-xs ${priceIncreaseTargets.breakeven.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                        />
                      )}
                    </span>
                    <span className="inline-block min-w-[50px]">
                      <span className="text-xs text-foreground/40">2x: </span>
                      {priceIncreaseTargets.double.debtToken !== null && (
                        <PriceIncreaseDisplay
                          percentage={priceIncreaseTargets.double.debtToken}
                          className={`text-xs ${priceIncreaseTargets.double.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                        />
                      )}
                    </span>
                    <span className="inline-block min-w-[50px]">
                      <span className="text-xs text-foreground/40">10x: </span>
                      {priceIncreaseTargets.tenx.debtToken !== null && (
                        <PriceIncreaseDisplay
                          percentage={priceIncreaseTargets.tenx.debtToken}
                          className={`text-xs ${priceIncreaseTargets.tenx.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                        />
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
  ) : (
    // TEA token rows (2 rows)
    <>
      {/* First row - collateral values */}
      <tr className="text-left text-foreground">
        {/* Token column - spans 2 rows */}
        <td rowSpan={2} className="py-2 pr-4 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              {vaultData && parseUnits(vaultData.rate || "0", 0) > 0n ? (
                <HoverPopupMobile
                  size="200"
                  asChild
                  trigger={
                    <div className="relative cursor-pointer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/hat.svg"
                        width="18"
                        height="18"
                        className="hat-outline absolute -top-[11px] left-1/2 z-10"
                        alt="SIR Rewards Hat"
                        style={{
                          width: "18px",
                          height: "18px",
                          minWidth: "18px",
                          minHeight: "18px",
                          transform: "translateX(-40%) rotate(8deg)",
                        }}
                      />
                      <span className="pt-1">TEA</span>
                    </div>
                  }
                >
                  <span className="text-[13px] font-medium">
                    {(() => {
                      // Calculate user's proportional daily earnings
                      const parsedRateAmount = parseUnits(
                        vaultData.rate || "0",
                        0,
                      );
                      const dailyRate = parsedRateAmount * 24n * 60n * 60n;

                      // Get user's TEA balance
                      const userBalance = teaBal ?? 0n;

                      // Get total supply and vault's locked liquidity (TEA balance that doesn't earn rewards)
                      const totalSupply = parseUnits(
                        vaultData.teaSupply || "0",
                        0,
                      );
                      const vaultTeaBalance = parseUnits(
                        vaultData.lockedLiquidity || "0",
                        0,
                      );

                      // Calculate effective supply (total supply minus vault's TEA balance)
                      // Only TEA tokens held by users (not the vault) participate in rewards
                      const effectiveSupply =
                        totalSupply > vaultTeaBalance
                          ? totalSupply - vaultTeaBalance
                          : 0n;

                      // Calculate user's proportional share of daily SIR rewards
                      const userDailyEarnings =
                        effectiveSupply > 0n
                          ? (dailyRate * userBalance) / effectiveSupply
                          : 0n;

                      return (
                        <>
                          You are earning{" "}
                          <DisplayFormattedNumber
                            num={formatUnits(userDailyEarnings, 12)}
                            significant={3}
                          />{" "}
                          {getSirSymbol()}/day from this vault.
                        </>
                      );
                    })()}
                  </span>
                </HoverPopupMobile>
              ) : (
                <span className="">TEA</span>
              )}
              <span className="text-foreground/70">-</span>
              <span className="text-xl text-accent-100">
                {getDisplayVaultId(row.vaultId)}
              </span>
            </div>
            {/* Expand button for mobile */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-1 transition-colors hover:bg-foreground/10 md:hidden"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-foreground/60" />
              ) : (
                <ChevronDown className="h-4 w-4 text-foreground/60" />
              )}
            </button>
          </div>
        </td>

        {/* Vault column - spans 2 rows */}
        <td rowSpan={2} className="py-2 pr-4 font-normal text-foreground/80">
          <div className="flex items-center">
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
              <sup className="ml-0.5 text-[10px] font-semibold">
                {getLeverageRatio(Number.parseInt(row.leverageTier))}
              </sup>
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
              <sup className="ml-0.5 text-[10px] font-semibold">
                {getLeverageRatio(Number.parseInt(row.leverageTier))}
              </sup>
            </div>
          </div>
        </td>

        {/* Value column - collateral */}
        <td className="pb-0.5 pr-4 pt-1.5 text-right font-normal">
          <span className="text-sm">
            <DisplayFormattedNumber num={currentCollateral} significant={3} />
            <span className="ml-0.5 text-foreground/60">
              {row.collateralSymbol}
            </span>
          </span>
        </td>

        {/* PnL column - collateral */}
        <td className="relative pb-0.5 pr-4 pt-1.5 text-right font-normal">
          <span
            className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {pnlCollateral >= 0 ? "+" : ""}
            <DisplayFormattedNumber num={pnlCollateral} significant={3} />
            <span className="ml-0.5 text-foreground/60">
              {row.collateralSymbol}
            </span>
          </span>
          {/* Floating emoji for profitable positions - positioned between rows */}
          {pnlCollateral >= 0 && (
            <HoverPopupMobile
              size="200"
              trigger={
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="absolute -right-2 bottom-[-8px] z-10 animate-[pulse_2s_ease-in-out_infinite] cursor-pointer transition-transform hover:scale-125"
                >
                  {(() => {
                    const percentGain =
                      initialCollateral > 0
                        ? (pnlCollateral / initialCollateral) * 100
                        : 0;

                    if (percentGain >= 200) return "🚀"; // 200%+ gains - rocket
                    if (percentGain >= 100) return "💎"; // 100-200% gains - diamond hands
                    if (percentGain >= 50) return "🔥"; // 50-100% gains - fire
                    if (percentGain >= 20) return "⚡"; // 20-50% gains - lightning
                    return "✨"; // 0-20% gains - sparkles
                  })()}
                </button>
              }
            >
              <span className="text-[13px] font-medium">
                Tweet about your {(() => {
                  const percentGain = initialCollateral > 0
                    ? (pnlCollateral / initialCollateral) * 100
                    : 0;
                  return percentGain >= 1
                    ? `${percentGain.toFixed(0)}%`
                    : `${percentGain.toFixed(1)}%`;
                })()} {row.collateralSymbol} gains! 🎉
              </span>
            </HoverPopupMobile>
          )}
        </td>

        {/* Break-even time column */}
        <td className="hidden pb-0.5 pr-2 pt-1.5 text-right font-normal md:table-cell">
          <TimeDisplay
            days={
              isInfiniteTime && breakevenTimeDays !== 0
                ? Infinity
                : breakevenTimeDays
            }
            className={`text-xs ${breakevenTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          />
        </td>

        {/* 2x time column */}
        <td className="hidden pb-0.5 pr-2 pt-1.5 text-right font-normal md:table-cell">
          <TimeDisplay
            days={
              isInfiniteTime && doubleTimeDays !== 0 ? Infinity : doubleTimeDays
            }
            className={`text-xs ${doubleTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          />
        </td>

        {/* 10x time column */}
        <td className="hidden pb-0.5 pr-4 pt-1.5 text-right font-normal md:table-cell">
          <TimeDisplay
            days={
              isInfiniteTime && tenxTimeDays !== 0 ? Infinity : tenxTimeDays
            }
            className={`text-xs ${tenxTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          />
        </td>

        {/* Actions column - spans 2 rows */}
        <td rowSpan={2} className="py-2 text-center">
          {/* Small and Medium screens: Dropdown menu for all actions */}
          <div className="lg:hidden">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`relative h-8 w-8 border border-foreground/20 bg-secondary p-0 hover:bg-primary/20 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:hover:bg-primary ${!isApe && (teaRewards ?? 0n) >= 100000000000000000n ? "claim-button-gold-glow" : ""}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-foreground/10 bg-secondary"
              >
                <Show when={!isApe && (teaRewards ?? 0n) > 0n}>
                  <DropdownMenuItem
                    onClick={() => setSelectedRow("claim")}
                    disabled={!Number(teaRewards)}
                    className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                  >
                    <span>Claim</span>
                    <span className="text-gray-300">
                      <DisplayFormattedNumber num={rewards} significant={2} />{" "}
                      {getSirSymbol()}
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
                  Close
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

          {/* Large screens: Close button + More dropdown */}
          <div className="hidden justify-center space-x-1 lg:flex">
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
              className="h-7 rounded-md px-3 text-[12px]"
            >
              Close
            </Button>
            {/* More dropdown for additional actions */}
            <DropdownMenu
              open={dropdownOpenLg}
              onOpenChange={setDropdownOpenLg}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`relative h-7 w-7 border border-foreground/20 bg-secondary p-0 hover:bg-primary/20 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:hover:bg-primary ${!isApe && (teaRewards ?? 0n) >= 100000000000000000n ? "claim-button-gold-glow" : ""}`}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-foreground/10 bg-secondary"
              >
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
                      <DisplayFormattedNumber num={rewards} significant={2} />{" "}
                      {getSirSymbol()}
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
        </td>
      </tr>

      {/* Second row - debt token values */}
      <tr className="border-b border-foreground/5 text-left text-foreground">
        {/* Value column - debt token */}
        <td className="pb-1.5 pr-4 pt-0.5 text-right font-normal">
          <span className="text-sm">
            <DisplayFormattedNumber
              num={currentDebtTokenValue}
              significant={3}
            />
            <span className="ml-0.5 text-foreground/60">{row.debtSymbol}</span>
          </span>
        </td>

        {/* PnL column - debt token */}
        <td className="pb-1.5 pr-4 pt-0.5 text-right font-normal">
          <span
            className={`text-sm ${pnlDebtToken > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {pnlDebtToken >= 0 ? "+" : ""}
            <DisplayFormattedNumber num={pnlDebtToken} significant={3} />
            <span className="ml-0.5 text-foreground/60">{row.debtSymbol}</span>
          </span>
        </td>

        {/* Break-even time column - debt token */}
        <td className="hidden pb-1.5 pr-2 pt-0.5 text-right font-normal md:table-cell">
          <TimeDisplay
            days={
              isInfiniteTime && breakevenDebtTimeDays !== 0
                ? Infinity
                : breakevenDebtTimeDays
            }
            className={`text-xs ${breakevenDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          />
        </td>

        {/* 2x time column - debt token */}
        <td className="hidden pb-1.5 pr-2 pt-0.5 text-right font-normal md:table-cell">
          <TimeDisplay
            days={
              isInfiniteTime && doubleDebtTimeDays !== 0
                ? Infinity
                : doubleDebtTimeDays
            }
            className={`text-xs ${doubleDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          />
        </td>

        {/* 10x time column - debt token */}
        <td className="hidden pb-1.5 pr-4 pt-0.5 text-right font-normal md:table-cell">
          <TimeDisplay
            days={
              isInfiniteTime && tenxDebtTimeDays !== 0
                ? Infinity
                : tenxDebtTimeDays
            }
            className={`text-xs ${tenxDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          />
        </td>
      </tr>

      {/* Expanded row for mobile - shows hidden columns */}
      {isExpanded && (
        <tr className="border-b border-foreground/5 bg-foreground/5 md:hidden">
          <td colSpan={7} className="px-4 py-3">
            <div className="space-y-3">
              {/* Collateral Required Time */}
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">
                  Required Time ({row.collateralSymbol})
                </span>
                <div className="space-x-4 text-right">
                  <span className="inline-block min-w-[50px]">
                    <span className="text-xs text-foreground/40">B/E: </span>
                    <TimeDisplay
                      days={
                        isInfiniteTime && breakevenTimeDays !== 0
                          ? Infinity
                          : breakevenTimeDays
                      }
                      className={`text-xs ${breakevenTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                    />
                  </span>
                  <span className="inline-block min-w-[50px]">
                    <span className="text-xs text-foreground/40">2x: </span>
                    <TimeDisplay
                      days={
                        isInfiniteTime && doubleTimeDays !== 0
                          ? Infinity
                          : doubleTimeDays
                      }
                      className={`text-xs ${doubleTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                    />
                  </span>
                  <span className="inline-block min-w-[50px]">
                    <span className="text-xs text-foreground/40">10x: </span>
                    <TimeDisplay
                      days={
                        isInfiniteTime && tenxTimeDays !== 0
                          ? Infinity
                          : tenxTimeDays
                      }
                      className={`text-xs ${tenxTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                    />
                  </span>
                </div>
              </div>

              {/* Debt Token Required Time */}
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">
                  Required Time ({row.debtSymbol})
                </span>
                <div className="space-x-4 text-right">
                  <span className="inline-block min-w-[50px]">
                    <span className="text-xs text-foreground/40">B/E: </span>
                    <TimeDisplay
                      days={
                        isInfiniteTime && breakevenDebtTimeDays !== 0
                          ? Infinity
                          : breakevenDebtTimeDays
                      }
                      className={`text-xs ${breakevenDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                    />
                  </span>
                  <span className="inline-block min-w-[50px]">
                    <span className="text-xs text-foreground/40">2x: </span>
                    <TimeDisplay
                      days={
                        isInfiniteTime && doubleDebtTimeDays !== 0
                          ? Infinity
                          : doubleDebtTimeDays
                      }
                      className={`text-xs ${doubleDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                    />
                  </span>
                  <span className="inline-block min-w-[50px]">
                    <span className="text-xs text-foreground/40">10x: </span>
                    <TimeDisplay
                      days={
                        isInfiniteTime && tenxDebtTimeDays !== 0
                          ? Infinity
                          : tenxDebtTimeDays
                      }
                      className={`text-xs ${tenxDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                    />
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );

  // Return the content with the modal
  return (
    <>
      {content}
      {/* Share Position Modal */}
      <SharePositionModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        position={{
          isApe,
          collateralSymbol: row.collateralSymbol,
          debtSymbol: row.debtSymbol,
          leverageTier: row.leverageTier,
          pnlCollateral,
          pnlDebtToken,
          currentCollateral,
          currentDebtTokenValue,
          initialCollateral,
          initialDebtTokenValue,
        }}
      />
    </>
  );
}
