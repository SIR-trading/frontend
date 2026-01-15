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
import { MoreVertical, Send, XCircle, Lock } from "lucide-react";
import HoverPopup from "@/components/ui/hover-popup";
import { parseUnits } from "viem";
import { useVaultData } from "@/contexts/VaultDataContext";
import {
  calculatePriceIncreaseToTarget,
  calculatePriceIncreaseWithSaturation,
  calculateBreakevenTime,
} from "@/lib/utils/breakeven";
import { calculateSaturationPrice } from "@/lib/utils/calculations";
import { PriceIncreaseDisplay } from "./PriceIncreaseDisplay";
import { TimeDisplay } from "./TimeDisplay";
import type { TUserPosition } from "@/server/queries/vaults";
import { TwitterIcon } from "@/components/ui/icons/twitter-icon";
import { SharePositionModal } from "./SharePositionModal";
import { getCurrentChainConfig } from "@/lib/chains";
import Link from "next/link";
import { getLogoAssetWithFallback } from "@/lib/assets";
import { useTokenlistContext } from "@/contexts/tokenListProvider";

export function BurnTableRow({
  row,
  isApe,
  setSelectedRow,
  apeAddress: _apeAddress,
  teaBal,
  apeBal,
  teaRewards,
  useSaturationMode,
}: {
  row: TUserPosition;
  isApe: boolean;
  setSelectedRow: (mode: "burn" | "claim" | "transfer") => void;
  apeAddress?: string;
  teaBal?: bigint;
  apeBal?: bigint;
  teaRewards?: bigint;
  useSaturationMode?: boolean;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownOpenLg, setDropdownOpenLg] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Get vault data from context to get the rate for TEA rewards and reserves for APE
  const { getVaultById } = useVaultData();
  const vaultData = getVaultById(row.vaultId);

  // Get token map for logo lookups
  const { tokenMap } = useTokenlistContext();

  // Get current token balance (APE/TEA tokens have their own decimals)
  const currentBalance = isApe ? apeBal : teaBal;
  const tokenDecimals = row.decimals; // This is APE/TEA token decimals
  const balanceString = formatUnits(currentBalance ?? 0n, tokenDecimals);

  // Get current collateral value from quoteBurn
  const { data: quoteBurn, isLoading: quoteBurnLoading } = api.vault.quoteBurn.useQuery(
    {
      amount: balanceString,
      collateralToken: row.collateralToken,
      debtToken: row.debtToken,
      isApe,
      leverageTier: parseInt(row.leverageTier),
      decimals: tokenDecimals,
    },
    {
      staleTime: 1000 * 10, // Cache for 10s - prevents refetch if data is fresh
      enabled: Boolean(currentBalance && currentBalance > 0n),
      retry: false, // Don't retry on failure to prevent stream issues
    },
  );

  // Get APY for liquidity positions (for share card)
  const { data: apyDataForShare } = api.vault.getVaultApy.useQuery(
    { vaultId: row.vaultId },
    {
      enabled: Boolean(row.vaultId) && !isApe, // Only fetch for TEA positions
      staleTime: 60000, // Cache for 1 minute - prevents refetch if data is fresh
      retry: false, // Don't retry on failure
    },
  );

  // Current collateral amount (what you'd get if you burn now)
  const currentCollateralAmount = quoteBurn
    ? formatUnits(quoteBurn[0], row.vault.collateralToken.decimals)
    : "0";
  const currentCollateral = parseFloat(currentCollateralAmount);

  // Current debt token amount directly from quoteBurn
  const currentDebtTokenAmount = quoteBurn
    ? formatUnits(quoteBurn[1], row.vault.debtToken.decimals)
    : "0";
  const currentDebtTokenValue = parseFloat(currentDebtTokenAmount);

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

  // Calculate pair prices for both APE and TEA tokens
  let initialPrice = 0;
  let currentPrice = 0;
  let priceChangePercent = 0;

  if (initialCollateral > 0 && currentCollateral > 0) {
    initialPrice = initialDebtTokenValue / initialCollateral;
    currentPrice = currentDebtTokenValue / currentCollateral;
    if (initialPrice > 0) {
      priceChangePercent = ((currentPrice - initialPrice) / initialPrice) * 100;
    }
  }

  // Calculate PnL percentages for both APE and TEA tokens
  let collateralPnlPercent = 0;
  let leveragedPnlPercent = 0;
  let spotPnlPercent = 0;
  let spotPnlDebt = 0;

  // Calculate collateral PnL percentage (works for both APE and TEA)
  if (initialCollateral > 0) {
    collateralPnlPercent = (pnlCollateral / initialCollateral) * 100;
  }

  // Calculate debt token PnL percentage (requires initial debt token value)
  if (initialDebtTokenValue > 0) {
    leveragedPnlPercent = (pnlDebtToken / initialDebtTokenValue) * 100;

    if (isApe && initialCollateral > 0) {
      // Spot PnL: What if user held the collateral instead of taking leverage
      const priceChange = currentPrice / initialPrice;

      spotPnlPercent = (priceChange - 1) * 100;
      spotPnlDebt = initialCollateral * currentPrice - initialDebtTokenValue;
    }
  }

  const apeBalance = formatUnits(apeBal ?? 0n, tokenDecimals);
  const teaBalance = formatUnits(teaBal ?? 0n, tokenDecimals);

  const rewards = Number(formatUnits(teaRewards ?? 0n, 12)); // SIR always has 12 decimals

  // Check if TEA position is locked (lockEnd is a timestamp in seconds)
  const lockEndTimestamp = row.lockEnd ? parseInt(row.lockEnd) : 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const isLocked = !isApe && lockEndTimestamp > currentTimestamp;
  const remainingLockTime = isLocked ? lockEndTimestamp - currentTimestamp : 0;

  // Format remaining lock time for display
  const formatLockTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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

    // Calculate saturation price if we have vault data and are in saturation mode
    let saturationPrice: number | null = null;
    if (useSaturationMode && vaultData && currentPrice > 0) {
      const reserveApes = parseUnits(vaultData.reserveApes || "0", 0);
      const reserveLPers = parseUnits(vaultData.reserveLPers || "0", 0);
      if (reserveApes > 0n && reserveLPers > 0n) {
        saturationPrice = calculateSaturationPrice(
          currentPrice,
          reserveApes,
          reserveLPers,
          leverage,
        );
      }
    }

    // Helper to calculate price increase with or without saturation
    const calcPriceIncrease = (
      targetValue: number,
      currentValue: number,
      isCollateral: boolean,
    ): number | null => {
      if (useSaturationMode && saturationPrice && saturationPrice > 0) {
        return calculatePriceIncreaseWithSaturation(
          targetValue,
          currentValue,
          leverage,
          currentPrice,
          saturationPrice,
          isCollateral,
        );
      }
      return calculatePriceIncreaseToTarget(
        targetValue,
        currentValue,
        leverage,
        isCollateral,
      );
    };

    // Break-even: target = initial value
    priceIncreaseTargets.breakeven.collateral = calcPriceIncrease(
      initialCollateral,
      currentCollateral,
      true, // isCollateral
    );

    priceIncreaseTargets.breakeven.debtToken = calcPriceIncrease(
      initialDebtTokenValue,
      currentDebtTokenValue,
      false, // isDebtToken
    );

    // 2x: target = 2 * initial value
    priceIncreaseTargets.double.collateral = calcPriceIncrease(
      initialCollateral * 2,
      currentCollateral,
      true,
    );

    priceIncreaseTargets.double.debtToken = calcPriceIncrease(
      initialDebtTokenValue * 2,
      currentDebtTokenValue,
      false,
    );

    // 10x: target = 10 * initial value
    priceIncreaseTargets.tenx.collateral = calcPriceIncrease(
      initialCollateral * 10,
      currentCollateral,
      true,
    );

    priceIncreaseTargets.tenx.debtToken = calcPriceIncrease(
      initialDebtTokenValue * 10,
      currentDebtTokenValue,
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

  // Get explorer URL for token links
  const chainConfig = getCurrentChainConfig();
  const collateralTokenUrl = `${chainConfig.explorerUrl}/token/${row.collateralToken}`;
  const debtTokenUrl = `${chainConfig.explorerUrl}/token/${row.debtToken}`;

  // Render content based on position type
  const content = isApe ? (
    <>
      {/* Single row for APE position */}
      <tr className="border-b border-foreground/5 text-left text-foreground">
        {/* Token column */}
        <td className="py-2 pr-4 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              <span className="">APE</span>
              <span className="text-foreground/70">-</span>
              <span className="text-xl text-accent-100">
                {getDisplayVaultId(row.vaultId)}
              </span>
            </div>
          </div>
        </td>

        {/* Vault column */}
        <td className="py-2 pr-4 font-normal text-foreground/80">
          <div className="flex items-center">
            {/* Small and Medium: Show only icons */}
            <div className="flex items-center lg:hidden">
              <Link
                href={collateralTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] rounded-full bg-transparent"
                  alt={row.collateralToken}
                  address={row.collateralToken}
                  width={20}
                  height={20}
                />
              </Link>
              <span className="mx-1 text-[12px]">/</span>
              <Link
                href={debtTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] rounded-full"
                  alt={row.debtSymbol}
                  address={row.debtToken}
                  width={20}
                  height={20}
                />
              </Link>
              <sup className="ml-0.5 text-[10px] font-semibold">
                {getLeverageRatio(Number.parseInt(row.leverageTier))}
              </sup>
            </div>
            {/* Large screens: Show icons with text */}
            <div className="hidden items-center lg:flex">
              <Link
                href={collateralTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] flex-shrink-0 rounded-full bg-transparent"
                  alt={row.collateralToken}
                  address={row.collateralToken}
                  width={20}
                  height={20}
                />
                <span className="ml-1 text-[14px]">{row.collateralSymbol}</span>
              </Link>
              <span className="mx-1 text-[14px]">/</span>
              <Link
                href={debtTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] flex-shrink-0 rounded-full"
                  alt={row.debtSymbol}
                  address={row.debtToken}
                  width={20}
                  height={20}
                />
                <span className="ml-1 text-[14px]">{row.debtSymbol}</span>
              </Link>
              <sup className="ml-0.5 text-[10px] font-semibold">
                {getLeverageRatio(Number.parseInt(row.leverageTier))}
              </sup>
            </div>
          </div>
        </td>

        {/* Price column - stacked values */}
        <td className="hidden py-2 pr-4 text-left font-normal md:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-4 w-24 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <span className="text-foreground/80">
                  {row.collateralSymbol}:{" "}
                </span>
                <span>
                  {priceChangePercent >= 0 ? "+" : ""}
                  <DisplayFormattedNumber
                    num={priceChangePercent}
                    significant={2}
                  />
                  %
                </span>
              </span>
              <span className="text-xs text-foreground/60">
                (<HoverPopup
                  size="200"
                  trigger={
                    <span className="cursor-pointer">
                      <DisplayFormattedNumber num={initialPrice} significant={2} />
                    </span>
                  }
                >
                  <span className="text-[13px] font-medium">
                    Average Mint {row.collateralSymbol} Price
                  </span>
                </HoverPopup>
                <span className="mx-1">→</span>
                <HoverPopup
                  size="200"
                  trigger={
                    <span className="cursor-pointer">
                      <DisplayFormattedNumber num={currentPrice} significant={2} />
                    </span>
                  }
                >
                  <span className="text-[13px] font-medium">
                    Current {row.collateralSymbol} price
                  </span>
                </HoverPopup>
                <span className="ml-1">{row.debtSymbol}</span>)
              </span>
            </div>
          )}
        </td>

        {/* Value column - stacked values */}
        <td className="py-2 pr-4 text-right font-normal">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <DisplayFormattedNumber num={currentCollateral} significant={2} />
                <span className="ml-0.5 text-foreground/60">
                  {row.collateralSymbol}
                </span>
              </span>
              <span className="text-sm">
                <span className="mr-0.5 text-foreground/60">≈</span>
                <DisplayFormattedNumber
                  num={currentDebtTokenValue}
                  significant={2}
                />
                <span className="ml-0.5 text-foreground/60">
                  {row.debtSymbol}
                </span>
              </span>
            </div>
          )}
        </td>

        {/* PnL column */}
        <td className="hidden py-2 pr-4 text-right font-normal md:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <HoverPopup
              size="250"
              trigger={
                <div className="flex cursor-pointer flex-col items-end gap-0.5">
                  <span
                    className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                  >
                    {pnlCollateral >= 0 ? "+" : ""}
                    <DisplayFormattedNumber num={pnlCollateral} significant={2} />
                    <span className="ml-0.5 text-foreground/60">
                      {row.collateralSymbol}
                    </span>
                  </span>
                  <span
                    className={`text-sm ${pnlDebtToken > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                  >
                    {pnlDebtToken >= 0 ? "+" : ""}
                    <DisplayFormattedNumber num={pnlDebtToken} significant={2} />
                    <span className="ml-0.5 text-foreground/60">
                      {row.debtSymbol}
                    </span>
                  </span>
                </div>
              }
            >
              <span className="text-[13px] font-medium">
                Had you held spot {row.collateralSymbol}, your PnL would be{" "}
                {spotPnlDebt >= 0 ? "+" : ""}
                <DisplayFormattedNumber num={spotPnlDebt} significant={2} />{" "}
                {row.debtSymbol}
              </span>
            </HoverPopup>
          )}
        </td>

        {/* % PnL column */}
        <td className="relative hidden py-2 pr-4 text-center font-normal xs:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <HoverPopup
              size="250"
              trigger={
                <div className="flex cursor-pointer flex-col gap-0.5">
                  <span
                    className={`text-sm font-medium ${collateralPnlPercent > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                  >
                    {collateralPnlPercent >= 0 ? "+" : ""}
                    <DisplayFormattedNumber
                      num={collateralPnlPercent}
                      significant={2}
                    />
                    %
                  </span>
                  <span
                    className={`text-sm font-medium ${leveragedPnlPercent > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                  >
                    {leveragedPnlPercent >= 0 ? "+" : ""}
                    <DisplayFormattedNumber
                      num={leveragedPnlPercent}
                      significant={2}
                    />
                    %
                  </span>
                </div>
              }
            >
              <span className="text-[13px] font-medium">
                Had you held spot {row.collateralSymbol}, your PnL would be{" "}
                {spotPnlPercent >= 0 ? "+" : ""}
                <DisplayFormattedNumber num={spotPnlPercent} significant={2} />%
                in {row.debtSymbol}
              </span>
            </HoverPopup>
          )}
        </td>

        {/* Break-even price gain column - stacked values */}
        <td className="hidden py-2 pr-2 text-right font-normal xl:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <PriceIncreaseDisplay
                  percentage={priceIncreaseTargets.breakeven.collateral}
                  className={`text-xs ${priceIncreaseTargets.breakeven.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
              <span className="text-sm">
                <PriceIncreaseDisplay
                  percentage={priceIncreaseTargets.breakeven.debtToken}
                  className={`text-xs ${priceIncreaseTargets.breakeven.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
            </div>
          )}
        </td>

        {/* 2x price gain column - stacked values */}
        <td className="hidden py-2 pr-2 text-right font-normal xl:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <PriceIncreaseDisplay
                  percentage={priceIncreaseTargets.double.collateral}
                  className={`text-xs ${priceIncreaseTargets.double.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
              <span className="text-sm">
                <PriceIncreaseDisplay
                  percentage={priceIncreaseTargets.double.debtToken}
                  className={`text-xs ${priceIncreaseTargets.double.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
            </div>
          )}
        </td>

        {/* 10x price gain column - stacked values */}
        <td className="hidden py-2 pr-4 text-right font-normal xl:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <PriceIncreaseDisplay
                  percentage={priceIncreaseTargets.tenx.collateral}
                  className={`text-xs ${priceIncreaseTargets.tenx.collateral === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
              <span className="text-sm">
                <PriceIncreaseDisplay
                  percentage={priceIncreaseTargets.tenx.debtToken}
                  className={`text-xs ${priceIncreaseTargets.tenx.debtToken === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
            </div>
          )}
        </td>

        {/* Actions column */}
        <td className="py-2 text-center">
          {/* Small and Medium screens: Dropdown menu for all actions */}
          <div className="xl:hidden">
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
                {/* Share option */}
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    setShareModalOpen(true);
                  }}
                  className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                >
                  <TwitterIcon className="mr-2 h-3 w-3" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground/10" />
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
                  <XCircle className="mr-2 h-3 w-3" />
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

          {/* Large screens: Close button + Share button + More dropdown */}
          <div className="hidden justify-center space-x-1 xl:flex">
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
            {/* Share button */}
            <Button
              onClick={() => setShareModalOpen(true)}
              type="button"
              className="h-7 rounded-md px-3 text-[12px]"
            >
              <TwitterIcon className="mr-1.5 h-3.5 w-3.5" />
              Share
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
    </>
  ) : (
    // TEA token row (single row with stacked content)
    <>
      {/* Single row for TEA position */}
      <tr className="border-b border-foreground/5 text-left text-foreground">
        {/* Token column */}
        <td className="py-2 pr-4 font-normal">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-1">
              {vaultData && parseUnits(vaultData.rate || "0", 0) > 0n ? (
                <HoverPopup
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
                            significant={2}
                          />{" "}
                          {getSirSymbol()}/day from this vault.
                        </>
                      );
                    })()}
                  </span>
                </HoverPopup>
              ) : (
                <span className="">TEA</span>
              )}
              {isLocked && (
                <HoverPopup
                  size="200"
                  trigger={
                    <span className="ml-1 cursor-pointer text-amber-500">
                      <Lock className="inline h-3.5 w-3.5" />
                    </span>
                  }
                >
                  <span className="text-[13px] font-medium">
                    Unlocks in {formatLockTime(remainingLockTime)}
                  </span>
                </HoverPopup>
              )}
              <span className="text-foreground/70">-</span>
              <span className="text-xl text-accent-100">
                {getDisplayVaultId(row.vaultId)}
              </span>
            </div>
          </div>
        </td>

        {/* Vault column */}
        <td className="py-2 pr-4 font-normal text-foreground/80">
          <div className="flex items-center">
            {/* Small and Medium: Show only icons */}
            <div className="flex items-center lg:hidden">
              <Link
                href={collateralTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] rounded-full bg-transparent"
                  alt={row.collateralToken}
                  address={row.collateralToken}
                  width={20}
                  height={20}
                />
              </Link>
              <span className="mx-1 text-[12px]">/</span>
              <Link
                href={debtTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] rounded-full"
                  alt={row.debtSymbol}
                  address={row.debtToken}
                  width={20}
                  height={20}
                />
              </Link>
              <sup className="ml-0.5 text-[10px] font-semibold">
                {getLeverageRatio(Number.parseInt(row.leverageTier))}
              </sup>
            </div>
            {/* Large screens: Show icons with text */}
            <div className="hidden items-center lg:flex">
              <Link
                href={collateralTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] flex-shrink-0 rounded-full bg-transparent"
                  alt={row.collateralToken}
                  address={row.collateralToken}
                  width={20}
                  height={20}
                />
                <span className="ml-1 text-[14px]">{row.collateralSymbol}</span>
              </Link>
              <span className="mx-1 text-[14px]">/</span>
              <Link
                href={debtTokenUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center transition-opacity hover:opacity-70"
              >
                <TokenImage
                  className="min-h-[20px] min-w-[20px] flex-shrink-0 rounded-full"
                  alt={row.debtSymbol}
                  address={row.debtToken}
                  width={20}
                  height={20}
                />
                <span className="ml-1 text-[14px]">{row.debtSymbol}</span>
              </Link>
              <sup className="ml-0.5 text-[10px] font-semibold">
                {getLeverageRatio(Number.parseInt(row.leverageTier))}
              </sup>
            </div>
          </div>
        </td>

        {/* Price column - stacked values */}
        <td className="hidden py-2 pr-4 text-left font-normal md:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-4 w-24 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <span className="text-foreground/80">
                  {row.collateralSymbol}:{" "}
                </span>
                <span>
                  {priceChangePercent >= 0 ? "+" : ""}
                  <DisplayFormattedNumber
                    num={priceChangePercent}
                    significant={2}
                  />
                  %
                </span>
              </span>
              <span className="text-xs text-foreground/60">
                (<HoverPopup
                  size="200"
                  trigger={
                    <span className="cursor-pointer">
                      <DisplayFormattedNumber num={initialPrice} significant={2} />
                    </span>
                  }
                >
                  <span className="text-[13px] font-medium">
                    Average Mint {row.collateralSymbol} Price
                  </span>
                </HoverPopup>
                <span className="mx-1">→</span>
                <HoverPopup
                  size="200"
                  trigger={
                    <span className="cursor-pointer">
                      <DisplayFormattedNumber num={currentPrice} significant={2} />
                    </span>
                  }
                >
                  <span className="text-[13px] font-medium">
                    Current {row.collateralSymbol} price
                  </span>
                </HoverPopup>
                <span className="ml-1">{row.debtSymbol}</span>)
              </span>
            </div>
          )}
        </td>

        {/* Value column - stacked values */}
        <td className="py-2 pr-4 text-right font-normal">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <DisplayFormattedNumber num={currentCollateral} significant={2} />
                <span className="ml-0.5 text-foreground/60">
                  {row.collateralSymbol}
                </span>
              </span>
              <span className="text-sm">
                <span className="mr-0.5 text-foreground/60">≈</span>
                <DisplayFormattedNumber
                  num={currentDebtTokenValue}
                  significant={2}
                />
                <span className="ml-0.5 text-foreground/60">
                  {row.debtSymbol}
                </span>
              </span>
            </div>
          )}
        </td>

        {/* PnL column - stacked values */}
        <td className="relative hidden py-2 pr-4 text-right font-normal md:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-20 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-0.5">
              <span
                className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              >
                {pnlCollateral >= 0 ? "+" : ""}
                <DisplayFormattedNumber num={pnlCollateral} significant={2} />
                <span className="ml-0.5 text-foreground/60">
                  {row.collateralSymbol}
                </span>
              </span>
              <span
                className={`text-sm ${pnlDebtToken > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              >
                {pnlDebtToken >= 0 ? "+" : ""}
                <DisplayFormattedNumber num={pnlDebtToken} significant={2} />
                <span className="ml-0.5 text-foreground/60">
                  {row.debtSymbol}
                </span>
              </span>
            </div>
          )}
        </td>

        {/* % PnL column - stacked values */}
        <td className="hidden py-2 pr-4 text-center font-normal xs:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-medium ${collateralPnlPercent > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              >
                {collateralPnlPercent >= 0 ? "+" : ""}
                <DisplayFormattedNumber
                  num={collateralPnlPercent}
                  significant={2}
                />
                %
              </span>
              <span
                className={`text-sm font-medium ${leveragedPnlPercent > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
              >
                {leveragedPnlPercent >= 0 ? "+" : ""}
                <DisplayFormattedNumber
                  num={leveragedPnlPercent}
                  significant={2}
                />
                %
              </span>
            </div>
          )}
        </td>

        {/* Break-even time column - stacked values */}
        <td className="hidden py-2 pr-2 text-right font-normal xl:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : !currentBalance || currentBalance === 0n ? (
            <span className="text-xs text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <TimeDisplay
                  days={
                    isInfiniteTime && breakevenTimeDays !== 0
                      ? Infinity
                      : breakevenTimeDays
                  }
                  className={`text-xs ${breakevenTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
              <span className="text-sm">
                <TimeDisplay
                  days={
                    isInfiniteTime && breakevenDebtTimeDays !== 0
                      ? Infinity
                      : breakevenDebtTimeDays
                  }
                  className={`text-xs ${breakevenDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
            </div>
          )}
        </td>

        {/* 2x time column - stacked values */}
        <td className="hidden py-2 pr-2 text-right font-normal xl:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : !currentBalance || currentBalance === 0n ? (
            <span className="text-xs text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <TimeDisplay
                  days={
                    isInfiniteTime && doubleTimeDays !== 0
                      ? Infinity
                      : doubleTimeDays
                  }
                  className={`text-xs ${doubleTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
              <span className="text-sm">
                <TimeDisplay
                  days={
                    isInfiniteTime && doubleDebtTimeDays !== 0
                      ? Infinity
                      : doubleDebtTimeDays
                  }
                  className={`text-xs ${doubleDebtTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
            </div>
          )}
        </td>

        {/* 10x time column - stacked values */}
        <td className="hidden py-2 pr-4 text-right font-normal xl:table-cell">
          {quoteBurnLoading ? (
            <div className="flex flex-col items-end gap-0.5">
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-foreground/10"></div>
            </div>
          ) : !currentBalance || currentBalance === 0n ? (
            <span className="text-xs text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">
                <TimeDisplay
                  days={
                    isInfiniteTime && tenxTimeDays !== 0 ? Infinity : tenxTimeDays
                  }
                  className={`text-xs ${tenxTimeDays === 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
                />
              </span>
              <span className="text-sm">
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
          )}
        </td>

        {/* Actions column */}
        <td className="py-2 text-center">
          {/* Small and Medium screens: Dropdown menu for all actions */}
          <div className="xl:hidden">
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
                {/* Share option */}
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    setShareModalOpen(true);
                  }}
                  className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                >
                  <TwitterIcon className="mr-2 h-3 w-3" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground/10" />
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
                {isLocked ? (
                  <HoverPopup
                    size="200"
                    trigger={
                      <div>
                        <DropdownMenuItem
                          disabled={true}
                          className="cursor-not-allowed opacity-50"
                        >
                          <Lock className="mr-2 h-3 w-3 text-amber-500" />
                          Close
                        </DropdownMenuItem>
                      </div>
                    }
                  >
                    <span className="text-[13px] font-medium">
                      Locked for {formatLockTime(remainingLockTime)}
                    </span>
                  </HoverPopup>
                ) : (
                  <DropdownMenuItem
                    onClick={() => setSelectedRow("burn")}
                    disabled={parseFloat(teaBalance) === 0}
                    className="cursor-pointer hover:bg-primary/20 dark:hover:bg-primary"
                  >
                    <XCircle className="mr-2 h-3 w-3" />
                    Close
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-foreground/10" />
                <DropdownMenuItem
                  onClick={() => {
                    setDropdownOpen(false);
                    setTimeout(() => setSelectedRow("transfer"), 100);
                  }}
                  disabled={parseFloat(teaBalance) === 0}
                  className="cursor-pointer hover:bg-accent/60 dark:hover:bg-accent"
                >
                  <Send className="mr-2 h-3 w-3" />
                  Transfer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Large screens: Close button + Share button + More dropdown */}
          <div className="hidden justify-center space-x-1 xl:flex">
            {isLocked ? (
              <HoverPopup
                size="200"
                trigger={
                  <div>
                    <Button
                      disabled={true}
                      type="button"
                      className="h-7 rounded-md px-3 text-[12px]"
                    >
                      <Lock className="mr-1 h-3 w-3" />
                      Close
                    </Button>
                  </div>
                }
              >
                <span className="text-[13px] font-medium">
                  Locked for {formatLockTime(remainingLockTime)}
                </span>
              </HoverPopup>
            ) : (
              <Button
                onClick={() => {
                  setSelectedRow("burn");
                }}
                disabled={parseFloat(teaBalance) === 0}
                type="button"
                className="h-7 rounded-md px-3 text-[12px]"
              >
                Close
              </Button>
            )}
            {/* Share button */}
            <Button
              onClick={() => setShareModalOpen(true)}
              type="button"
              className="h-7 rounded-md px-3 text-[12px]"
            >
              <TwitterIcon className="mr-1.5 h-3.5 w-3.5" />
              Share
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
                  disabled={parseFloat(teaBalance) === 0}
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
          averageEntryPrice: initialPrice,
          currentPrice: currentPrice,
          vaultLink: `sir.trading/${isApe ? "leverage" : "liquidity"}?vault=${getDisplayVaultId(row.vaultId)}`,
          collateralLogoUrl:
            getLogoAssetWithFallback(row.collateralToken, tokenMap).fallback ??
            (getLogoAssetWithFallback(row.collateralToken, tokenMap).primary as string),
          debtLogoUrl:
            getLogoAssetWithFallback(row.debtToken, tokenMap).fallback ??
            (getLogoAssetWithFallback(row.debtToken, tokenMap).primary as string),
          feesApy: apyDataForShare?.feesApy,
          sirRewardsApy: apyDataForShare?.sirRewardsApy,
        }}
      />
    </>
  );
}
