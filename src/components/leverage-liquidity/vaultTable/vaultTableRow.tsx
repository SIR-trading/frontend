import { Badge, type badgeVariants } from "@/components/ui/badge";
import { roundDown } from "@/lib/utils";
import Image from "next/image";
import { getSirLogo } from "@/lib/assets";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { motion } from "motion/react";
import type { VariantProps } from "class-variance-authority";
import { useMintFormProviderApi } from "@/components/providers/mintFormProviderApi";
import type { TVault, TAddressString } from "@/lib/types";
import { formatUnits, parseUnits } from "viem";
import { useMemo } from "react";
import useCalculateVaultHealth from "./hooks/useCalculateVaultHealth";
import { useTheme } from "next-themes";
import HoverPopupMobile from "@/components/ui/hover-popup-mobile";
import { TokenDisplay } from "@/components/ui/token-display";
import {
  calculateApeVaultFee,
  getLeverageRatio,
} from "@/lib/utils/calculations";

import buildData from "@/../public/build-data.json";
const BASE_FEE = buildData.systemParams.baseFee;

import { TokenImage } from "@/components/shared/TokenImage";
import useVaultFilterStore from "@/lib/store";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import DuneChartPopup from "@/components/shared/duneChartPopup";
import { useDuneCharts } from "../mintForm/hooks/useDuneCharts";

export function VaultTableRow({
  pool,
  isApe,
  badgeVariant: _badgeVariant,
  number: _number,
  apyData,
  isApyLoading,
}: {
  badgeVariant: VariantProps<typeof badgeVariants>;
  number: string;
  pool: TVault;
  isApe: boolean;
  apyData?: {
    apy: number;
    feesApy: number;
    sirRewardsApy: number;
    feesCount: number;
  };
  isApyLoading?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const fee = calculateApeVaultFee(pool.leverageTier, BASE_FEE) * 100;

  // Calculate fee color intensity (max fee is ~49% for tier 2)
  const MAX_FEE = 49; // Maximum possible fee percentage
  const feeIntensity = Math.min(fee / MAX_FEE, 1); // Normalize to 0-1

  // Generate RGB color based on theme
  const getFeeColor = () => {
    if (!isApe) return undefined;

    if (isDarkMode) {
      // Dark theme: from light pink/white to deep red
      const maxRed = 225;
      const maxGreen = 29;
      const maxBlue = 72;

      const red = Math.round(255 - (255 - maxRed) * feeIntensity);
      const green = Math.round(255 - (255 - maxGreen) * feeIntensity);
      const blue = Math.round(255 - (255 - maxBlue) * feeIntensity);

      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Light theme: from black to intense red with faster intensity curve
      const maxRed = 225;
      const maxGreen = 29;
      const maxBlue = 72;

      // Apply a power curve to make low values more visible
      // Using sqrt to accelerate the intensity for low values
      const adjustedIntensity = Math.sqrt(feeIntensity);

      const red = Math.round(maxRed * adjustedIntensity);
      const green = Math.round(maxGreen * adjustedIntensity);
      const blue = Math.round(maxBlue * adjustedIntensity);

      return `rgb(${red}, ${green}, ${blue})`;
    }
  };

  // Calculate POL (Protocol Owned Liquidity)
  const POL = useMemo(() => {
    const totalLocked = parseUnits(pool.totalTea, 0);
    const lockedLiquidity = parseUnits(pool.lockedLiquidity, 0);
    if (lockedLiquidity > 0n && totalLocked > 0n) {
      const percent = (lockedLiquidity * 10000n) / totalLocked;
      return parseFloat(percent.toString()) / 100;
    } else {
      return 0;
    }
  }, [pool.lockedLiquidity, pool.totalTea]);

  // Remove individual APY query since we get it from props now
  // const { data: apyData, isLoading: isApyLoading } = api.vault.getVaultApy.useQuery(
  //   { vaultId: pool.vaultId },
  //   {
  //     enabled: !isApe, // Only fetch if we need to show APY (Liquidity page)
  //     refetchOnMount: false,
  //     staleTime: 5 * 60 * 1000, // 5 minutes
  //   }
  // );

  const APY = useMemo(() => {
    if (isApe || (isApyLoading ?? false) || !apyData) return 0;
    return apyData.apy;
  }, [apyData, isApyLoading, isApe]);

  // Calculate APY color intensity for Liquidity page
  const getApyColor = () => {
    if (isApe || (isApyLoading ?? false) || !apyData) return undefined;

    // Use logarithmic scale for APY coloring since APY can be very high
    // We'll use these thresholds:
    // 0-50%: light intensity
    // 50-200%: medium intensity
    // 200-1000%: deep intensity
    // 1000%+: maximum intensity

    let apyIntensity: number;
    if (APY <= 50) {
      // Linear scale from 0 to 0.3 for 0-50% APY
      apyIntensity = (APY / 50) * 0.3;
    } else if (APY <= 200) {
      // Linear scale from 0.3 to 0.6 for 50-200% APY
      apyIntensity = 0.3 + ((APY - 50) / 150) * 0.3;
    } else if (APY <= 1000) {
      // Linear scale from 0.6 to 0.9 for 200-1000% APY
      apyIntensity = 0.6 + ((APY - 200) / 800) * 0.3;
    } else {
      // Maximum intensity for 1000%+ APY
      apyIntensity = 1;
    }

    // Base green color components (RGB for a nice green like #10b981)
    const maxRed = 16;
    const maxGreen = 185;
    const maxBlue = 129;

    if (isDarkMode) {
      // Dark theme: from light green/white to deep green
      const red = Math.round(255 - (255 - maxRed) * apyIntensity);
      const green = Math.round(255 - (255 - maxGreen) * apyIntensity);
      const blue = Math.round(255 - (255 - maxBlue) * apyIntensity);

      return `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Light theme: from black to intense green with faster intensity curve
      // Apply a power curve to make low values more visible
      // Using sqrt to accelerate the intensity for low values
      const adjustedIntensity = Math.sqrt(apyIntensity);

      const red = Math.round(maxRed * adjustedIntensity);
      const green = Math.round(maxGreen * adjustedIntensity);
      const blue = Math.round(maxBlue * adjustedIntensity);

      return `rgb(${red}, ${green}, ${blue})`;
    }
  };
  // // Add a query to retrieve collateral data
  // // Hydrate with server data
  // const { data: reservesData } = api.vault.getReserve.useQuery(
  //   {
  //     vaultId: Number.parseInt(pool.vaultId),
  //   },
  //   {
  //     // Dont fetch data on component mount
  //     // Data is from server and is fresh until invalidation
  //     refetchOnMount: false,
  //     initialData: [
  //       {
  //         reserveApes: pool.apeCollateral,
  //         reserveLPers: pool.teaCollateral,
  //         tickPriceX42: 0n,
  //       },
  //     ],
  //   },
  // );

  const reservesData = useMemo(() => {
    const a = [
      {
        reserveApes: pool.apeCollateral,
        reserveLPers: pool.teaCollateral,
        tickPriceX42: 0n,
      },
    ];
    return a;
  }, [pool.apeCollateral, pool.teaCollateral]);

  // Get both form contexts - one might be null depending on which page we're on
  const { setValue: setMintValue } = useMintFormProviderApi();

  // For Calculator page - create a wrapper function
  let calculatorSetValue: ((name: string, value: string) => void) | null = null;
  try {
    const calculatorForm = useFormContext<TCalculatorFormFields>();
    calculatorSetValue = (name: string, value: string) => {
      calculatorForm.setValue(name as keyof TCalculatorFormFields, value);
    };
  } catch {
    // Calculator form context not available, we're probably on Leverage/Liquidity page
  }

  // Use calculator form if available, otherwise use mint form
  const setValue = calculatorSetValue ?? setMintValue;

  const teaCollateral = parseFloat(
    formatUnits(reservesData[0]?.reserveLPers ?? 0n, 18),
  );
  const apeCollateral = parseFloat(
    formatUnits(reservesData[0]?.reserveApes ?? 0n, 18),
  );
  const tvl = apeCollateral + teaCollateral;
  const realLeverage = tvl / apeCollateral;
  const variant = useCalculateVaultHealth({
    isApe,
    leverageTier: pool.leverageTier,
    apeCollateral: reservesData[0]?.reserveApes ?? 0n,
    teaCollateral: reservesData[0]?.reserveLPers ?? 0n,
  });

  const getRealLeverage = () => {
    if (tvl === 0) {
      return "1";
    }
    if (!isFinite(realLeverage)) {
      return "1";
    }

    // Custom rounding: show 2 significant digits after the "1."
    // e.g., 1.5232 -> 1.52, 1.00889 -> 1.0089
    const fractionalPart = realLeverage - 1;

    if (fractionalPart === 0) {
      return "1";
    }

    // Find how many decimal places we need to show 2 significant digits
    const absValue = Math.abs(fractionalPart);
    let decimals = 2;

    // Count leading zeros after decimal point
    if (absValue < 0.1) {
      const log = Math.floor(Math.log10(absValue));
      decimals = 2 - log - 1;
    }

    return realLeverage.toFixed(decimals);
  };

  const showPercent = () => {
    if (!isApe) {
      return false;
    }
    if (tvl === 0) {
      return true;
    }
    if (!isFinite(realLeverage)) {
      return false;
    }
    if (variant.variant === "red") {
      return true;
    }
    return false;
  };
  const parsedRateAmount = parseUnits(String(pool.rate || "0"), 0); // CONVERT rate
  const setAll = useVaultFilterStore((state) => state.setAll);

  // Get Dune chart configuration for this vault
  const { embedUrl, hasChart } = useDuneCharts(pool.vaultId);
  return (
    <tr
      onClick={() => {
        setValue("versus", pool.debtToken + "," + pool.debtSymbol);
        setValue("long", pool.collateralToken + "," + pool.collateralSymbol);
        setValue("leverageTier", pool.leverageTier.toString());
        setAll(
          pool.leverageTier.toString(),
          pool.debtToken + "," + pool.debtSymbol,
          pool.collateralToken + "," + pool.collateralSymbol,
        );
      }}
      className="grid cursor-pointer grid-cols-5 rounded-md py-1 text-left text-[16px] text-sm font-normal transition-colors hover:bg-primary/20  sm:grid-cols-4 md:grid-cols-9 dark:hover:bg-primary"
    >
      <td className="h-full">
        <div className="flex h-full items-center gap-x-1">
          <span className="w-5">{pool.vaultId}</span>
          {parsedRateAmount > 0n && (
            <HoverPopupMobile
              size="200"
              asChild
              trigger={
                <div className="flex h-full items-center">
                  <Image
                    src={getSirLogo()}
                    height={24}
                    width={24}
                    className=" "
                    alt="Boost Icon"
                  />
                </div>
              }
            >
              <span className="text-[13px] font-medium">
                LPers of this vault are rewarded with{" "}
                <DisplayFormattedNumber
                  num={formatUnits(parsedRateAmount * 24n * 60n * 60n, 12)}
                  significant={3}
                />{" "}
                SIR/day.
              </span>
            </HoverPopupMobile>
          )}
        </div>
      </td>
      <td className="relative col-span-2 flex items-center sm:col-span-1 md:col-span-3">
        {/* Mobile view - logos with separator */}
        <div className="flex items-center md:hidden">
          <TokenImage
            address={pool.collateralToken as TAddressString}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Collateral token"
          />
          <span className="mx-1 font-normal">/</span>
          <TokenImage
            address={pool.debtToken as TAddressString}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Debt token"
          />
          {variant.variant === "red" ? (
            <HoverPopupMobile
              size="200"
              alignOffset={4}
              asChild
              trigger={
                <sup className="ml-0.5 text-[10px] font-semibold text-red">
                  {showPercent()
                    ? getRealLeverage()
                    : getLeverageRatio(pool.leverageTier)}
                </sup>
              }
            >
              <div className="text-[13px] font-medium">
                Insufficient liquidity for constant ^
                {getLeverageRatio(pool.leverageTier)} leverage
              </div>
            </HoverPopupMobile>
          ) : (
            <sup className="ml-0.5 text-[10px] font-semibold">
              {showPercent()
                ? getRealLeverage()
                : getLeverageRatio(pool.leverageTier)}
            </sup>
          )}
          {isApe && hasChart && embedUrl && (
            <div onClick={(e) => e.stopPropagation()} className="ml-2">
              <DuneChartPopup embedUrl={embedUrl} />
            </div>
          )}
        </div>

        {/* Desktop view - leaderboard format */}
        <div className="hidden items-center md:flex">
          <TokenImage
            address={pool.collateralToken as TAddressString}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Collateral token"
          />
          <span className="ml-1 font-normal">{pool.collateralSymbol}</span>
          <span className="mx-1 font-normal">/</span>
          <TokenImage
            address={pool.debtToken as TAddressString}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Debt token"
          />
          <span className="ml-1 font-normal">{pool.debtSymbol}</span>
          {isApe && hasChart && embedUrl && (
            <div onClick={(e) => e.stopPropagation()} className="ml-2">
              <DuneChartPopup embedUrl={embedUrl} />
            </div>
          )}
        </div>
      </td>
      <td className="flex items-center pl-1 sm:pl-3">
        {!isApe ? (
          <HoverPopupMobile
            size="250"
            trigger={
              <h4
                className={`cursor-pointer font-normal ${isApyLoading ? "text-foreground/80" : ""}`}
                style={{
                  color:
                    getApyColor() ?? (isApyLoading ? undefined : "inherit"),
                }}
              >
                {isApyLoading ? (
                  "..."
                ) : (
                  <>
                    <DisplayFormattedNumber num={APY} significant={2} />%
                  </>
                )}
              </h4>
            }
          >
            <div className="space-y-1 text-[13px] font-medium">
              <div className="text-left font-semibold">APY Breakdown:</div>
              <div className="flex justify-between gap-x-4">
                <span>LP Fees:</span>
                <span>
                  {apyData ? (
                    <>
                      <DisplayFormattedNumber
                        num={apyData.feesApy || 0}
                        significant={2}
                      />
                      %
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-x-4">
                <span>SIR Rewards:</span>
                <span>
                  {apyData ? (
                    <>
                      <DisplayFormattedNumber
                        num={apyData.sirRewardsApy || 0}
                        significant={2}
                      />
                      %
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
          </HoverPopupMobile>
        ) : (
          <h4
            className="text-[13px] font-normal"
            style={{ color: getFeeColor() }}
          >
            {roundDown(fee, 0)}%
          </h4>
        )}
      </td>
      <td className="hidden items-center gap-x-1 text-[13px] font-normal text-foreground/80 md:flex">
        <DisplayFormattedNumber num={POL} significant={2} />%
      </td>
      <td className="relative hidden items-center md:flex">
        <HoverPopupMobile
          size="200"
          alignOffset={4}
          asChild
          trigger={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <Badge
                variant={variant.variant}
                className="text-nowrap text-[10px]"
              >
                ^{getLeverageRatio(pool.leverageTier)}
                {showPercent() && (
                  <>
                    {" (^"}
                    {getRealLeverage()}
                    {")"}
                  </>
                )}
              </Badge>
            </motion.div>
          }
        >
          <div className="text-[13px] font-medium">
            <DisplayBadgeInfo
              variant={variant}
              isApe={isApe}
              leverageRatio={getLeverageRatio(pool.leverageTier).toString()}
            ></DisplayBadgeInfo>
          </div>
        </HoverPopupMobile>
      </td>

      <td className="relative flex items-center justify-end gap-x-1 text-right md:col-span-2">
        <HoverPopupMobile
          size="250"
          asChild
          trigger={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <TokenDisplay
                labelSize="small"
                amountSize="small"
                amount={parseUnits(pool.totalValue, 0)}
                decimals={pool.apeDecimals}
                unitLabel={pool.collateralSymbol}
              />
            </motion.div>
          }
        >
          <div className="space-y-1 text-[13px] font-medium">
            <div className="text-left font-semibold">TVL Breakdown:</div>
            <div className="flex justify-between gap-x-4">
              <span>Apes:</span>
              <span className="flex items-center gap-x-1">
                <TokenDisplay
                  amount={reservesData[0]?.reserveApes ?? 0n}
                  amountSize="small"
                  unitLabel={pool.collateralSymbol}
                  decimals={pool.apeDecimals}
                />
                <span>({Math.round((apeCollateral * 100) / (tvl ?? 1))}%)</span>
              </span>
            </div>
            <div className="flex justify-between gap-x-4">
              <span>LPers:</span>
              <span className="flex items-center gap-x-1">
                <TokenDisplay
                  amount={reservesData[0]?.reserveLPers ?? 0n}
                  amountSize="small"
                  unitLabel={pool.collateralSymbol}
                  decimals={pool.apeDecimals}
                />
                <span>({Math.round((teaCollateral * 100) / (tvl ?? 1))}%)</span>
              </span>
            </div>
          </div>
        </HoverPopupMobile>
      </td>
    </tr>
  );
}

function DisplayBadgeInfo({
  variant,
  isApe,
  leverageRatio,
}: {
  variant: VariantProps<typeof badgeVariants>;
  isApe: boolean;
  leverageRatio?: string;
}) {
  if (variant.variant === "green") {
    return isApe ? (
      <span>Healthy, more than enough liquidity</span>
    ) : (
      <span>Great for LPing</span>
    );
  }
  if (variant.variant === "yellow") {
    return isApe ? (
      <span>Not enough liquidity for new minters</span>
    ) : (
      <span>Good for LPing</span>
    );
  }
  if (variant.variant === "red") {
    return isApe ? (
      <span>Insufficient liquidity for constant ^{leverageRatio} leverage</span>
    ) : (
      <span>Minimally profitable</span>
    );
  }
}
