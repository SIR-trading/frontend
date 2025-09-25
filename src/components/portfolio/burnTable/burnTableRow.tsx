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
import { MoreVertical, Send } from "lucide-react";
import {
  calculatePriceIncreaseToTarget,
  calculateBreakevenTime,
  formatBreakevenTime,
} from "@/lib/utils/breakeven";
import { PriceIncreaseDisplay } from "./PriceIncreaseDisplay";
import type { TUserPosition } from "@/server/queries/vaults";

export function BurnTableRow({
  row,
  isApe,
  setSelectedRow,
  apeAddress,
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

  const rewards = Number(formatUnits(teaRewards ?? 0n, 18));

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
  let breakevenDisplay = "—";

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

    breakevenDisplay =
      priceIncreaseTargets.breakeven.collateral !== null &&
      priceIncreaseTargets.breakeven.collateral <= 0
        ? "✓"
        : "—";
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
      if (apyData.apy === 0) {
        breakevenDisplay = "∞";
      } else {
        const breakevenTime = calculateBreakevenTime(
          initialCollateral,
          currentCollateral,
          apyData.apy,
        );
        breakevenDisplay = formatBreakevenTime(breakevenTime);
      }
    }
  }

  // Calculate time targets for TEA tokens (collateral and debt token)
  let doubleTimeDisplay = "—";
  let tenxTimeDisplay = "—";
  let breakevenDebtTimeDisplay = "—";
  let doubleDebtTimeDisplay = "—";
  let tenxDebtTimeDisplay = "—";

  if (!isApe) {
    const { data: apyData } = api.vault.getVaultApy.useQuery(
      { vaultId: row.vaultId },
      {
        enabled: Boolean(row.vaultId),
        staleTime: 60000, // Cache for 1 minute
      },
    );

    if (apyData?.apy !== undefined) {
      // If APY is 0, show infinity symbol
      if (apyData.apy === 0) {
        doubleTimeDisplay = "∞";
        tenxTimeDisplay = "∞";
        breakevenDebtTimeDisplay = "∞";
        doubleDebtTimeDisplay = "∞";
        tenxDebtTimeDisplay = "∞";
      } else {
        // Calculate time to reach 2x initial value (collateral)
        const doubleTime = calculateBreakevenTime(
          initialCollateral * 2,
          currentCollateral,
          apyData.apy,
        );
        doubleTimeDisplay = formatBreakevenTime(doubleTime);

        // Calculate time to reach 10x initial value (collateral)
        const tenxTime = calculateBreakevenTime(
          initialCollateral * 10,
          currentCollateral,
          apyData.apy,
        );
        tenxTimeDisplay = formatBreakevenTime(tenxTime);

        // For debt token values, we need to account for the exchange rate change
        // The debt token value grows based on collateral growth and exchange rate
        // Since TEA tokens earn yield in collateral, we calculate based on collateral APY

        // Break-even for debt token
        const breakevenDebtTime = calculateBreakevenTime(
          initialDebtTokenValue,
          currentDebtTokenValue,
          apyData.apy,
        );
        breakevenDebtTimeDisplay = formatBreakevenTime(breakevenDebtTime);

        // 2x for debt token
        const doubleDebtTime = calculateBreakevenTime(
          initialDebtTokenValue * 2,
          currentDebtTokenValue,
          apyData.apy,
        );
        doubleDebtTimeDisplay = formatBreakevenTime(doubleDebtTime);

        // 10x for debt token
        const tenxDebtTime = calculateBreakevenTime(
          initialDebtTokenValue * 10,
          currentDebtTokenValue,
          apyData.apy,
        );
        tenxDebtTimeDisplay = formatBreakevenTime(tenxDebtTime);
      }
    }
  }

  if (isApe) {
    return (
      <>
        {/* First row - collateral values */}
        <tr className="text-left text-foreground">
          {/* Token column - spans 2 rows */}
          <td rowSpan={2} className="py-2 pr-4 font-normal">
            <div className="flex items-center gap-x-1">
              <span className="">APE</span>
              <span className="text-foreground/70">-</span>
              <span className="text-xl text-accent-100">
                {getDisplayVaultId(row.vaultId)}
              </span>
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
          <td className="pb-0.5 pr-4 pt-1.5 text-right font-normal">
            <span
              className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
            >
              {pnlCollateral >= 0 ? "+" : ""}
              <DisplayFormattedNumber num={pnlCollateral} significant={3} />
              <span className="ml-0.5 text-foreground/60">
                {row.collateralSymbol}
              </span>
            </span>
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
                className="h-7 rounded-md px-4 text-[12px]"
              >
                Burn
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
      </>
    );
  }

  // TEA token rows (2 rows)
  return (
    <>
      {/* First row - collateral values */}
      <tr className="text-left text-foreground">
        {/* Token column - spans 2 rows */}
        <td rowSpan={2} className="py-2 pr-4 font-normal">
          <div className="flex items-center gap-x-1">
            <span className="">TEA</span>
            <span className="text-foreground/70">-</span>
            <span className="text-xl text-accent-100">
              {getDisplayVaultId(row.vaultId)}
            </span>
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
        <td className="pb-0.5 pr-4 pt-1.5 text-right font-normal">
          <span
            className={`text-sm ${pnlCollateral > 0 ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {pnlCollateral >= 0 ? "+" : ""}
            <DisplayFormattedNumber num={pnlCollateral} significant={3} />
            <span className="ml-0.5 text-foreground/60">
              {row.collateralSymbol}
            </span>
          </span>
        </td>

        {/* Break-even time column */}
        <td className="hidden pb-0.5 pr-2 pt-1.5 text-right font-normal md:table-cell">
          <span
            className={`${breakevenDisplay === "∞" ? "text-lg leading-none" : "text-xs"} ${breakevenDisplay === "✓" ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {breakevenDisplay}
          </span>
        </td>

        {/* 2x time column */}
        <td className="hidden pb-0.5 pr-2 pt-1.5 text-right font-normal md:table-cell">
          <span
            className={`${doubleTimeDisplay === "∞" ? "text-lg leading-none" : "text-xs"} ${doubleTimeDisplay === "✓" ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {doubleTimeDisplay}
          </span>
        </td>

        {/* 10x time column */}
        <td className="hidden pb-0.5 pr-4 pt-1.5 text-right font-normal md:table-cell">
          <span
            className={`${tenxTimeDisplay === "∞" ? "text-lg leading-none" : "text-xs"} ${tenxTimeDisplay === "✓" ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {tenxTimeDisplay}
          </span>
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
              className="h-7 rounded-md px-4 text-[12px]"
            >
              Burn
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
          <span
            className={`${breakevenDebtTimeDisplay === "∞" ? "text-lg leading-none" : "text-xs"} ${breakevenDebtTimeDisplay === "✓" ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {breakevenDebtTimeDisplay}
          </span>
        </td>

        {/* 2x time column - debt token */}
        <td className="hidden pb-1.5 pr-2 pt-0.5 text-right font-normal md:table-cell">
          <span
            className={`${doubleDebtTimeDisplay === "∞" ? "text-lg leading-none" : "text-xs"} ${doubleDebtTimeDisplay === "✓" ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {doubleDebtTimeDisplay}
          </span>
        </td>

        {/* 10x time column - debt token */}
        <td className="hidden pb-1.5 pr-4 pt-0.5 text-right font-normal md:table-cell">
          <span
            className={`${tenxDebtTimeDisplay === "∞" ? "text-lg leading-none" : "text-xs"} ${tenxDebtTimeDisplay === "✓" ? "text-accent-600 dark:text-accent-100" : ""}`}
          >
            {tenxDebtTimeDisplay}
          </span>
        </td>
      </tr>
    </>
  );
}
