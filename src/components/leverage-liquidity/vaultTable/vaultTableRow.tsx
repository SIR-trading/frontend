import { Badge, type badgeVariants } from "@/components/ui/badge";
import { roundDown } from "@/lib/utils";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { motion } from "motion/react";
import type { VariantProps } from "class-variance-authority";
import { useMintFormProviderApi } from "@/components/providers/mintFormProviderApi";
import type { TVault } from "@/lib/types";
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
  pool: vault,
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

  const fee = calculateApeVaultFee(vault.leverageTier, BASE_FEE) * 100;

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
    const totalLocked = parseUnits(vault.teaSupply, 0);
    const lockedLiquidity = parseUnits(vault.lockedLiquidity, 0);
    if (lockedLiquidity > 0n && totalLocked > 0n) {
      const percent = (lockedLiquidity * 10000n) / totalLocked;
      return parseFloat(percent.toString()) / 100;
    } else {
      return 0;
    }
  }, [vault.lockedLiquidity, vault.teaSupply]);

  // Remove individual APY query since we get it from props now
  // const { data: apyData, isLoading: isApyLoading } = api.vault.getVaultApy.useQuery(
  //   { vaultId: vault.vaultId },
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
  //     vaultId: Number.parseInt(vault.vaultId),
  //   },
  //   {
  //     // Dont fetch data on component mount
  //     // Data is from server and is fresh until invalidation
  //     refetchOnMount: false,
  //     initialData: [
  //       {
  //         reserveApes: vault.apeCollateral,
  //         reserveLPers: vault.teaCollateral,
  //         tickPriceX42: 0n,
  //       },
  //     ],
  //   },
  // );

  const reservesData = useMemo(() => {
    const a = [
      {
        reserveApes: BigInt(vault.reserveApes ?? 0),
        reserveLPers: BigInt(vault.reserveLPers ?? 0),
        tickPriceX42: 0n,
      },
    ];
    return a;
  }, [vault.reserveApes, vault.reserveLPers]);

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
    formatUnits(reservesData[0]?.reserveLPers ?? 0n, vault.collateralToken.decimals),
  );
  const apeCollateral = parseFloat(
    formatUnits(reservesData[0]?.reserveApes ?? 0n, vault.collateralToken.decimals),
  );
  const tvl = apeCollateral + teaCollateral;
  const realLeverage = tvl / apeCollateral;
  const variant = useCalculateVaultHealth({
    isApe,
    leverageTier: vault.leverageTier,
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
  const parsedRateAmount = parseUnits(String(vault.rate || "0"), 0); // CONVERT rate
  const setAll = useVaultFilterStore((state) => state.setAll);

  // Get Dune chart configuration for this vault
  const { embedUrl, hasChart } = useDuneCharts(parseInt(vault.id).toString());
  return (
    <tr
      onClick={() => {
        setValue("versus", vault.debtToken.id + "," + (vault.debtToken.symbol ?? ''));
        setValue("long", vault.collateralToken.id + "," + (vault.collateralToken.symbol ?? ''));
        setValue("leverageTier", vault.leverageTier.toString());
        setAll(
          vault.leverageTier.toString(),
          vault.debtToken.id + "," + (vault.debtToken.symbol ?? ''),
          vault.collateralToken.id + "," + (vault.collateralToken.symbol ?? ''),
        );
      }}
      className="relative flex cursor-pointer items-center justify-between rounded-md py-1 text-left text-[16px] text-sm font-normal transition-colors hover:bg-primary/20 dark:hover:bg-primary"
    >
      <td className="w-12 flex-shrink-0 pl-3 sm:w-14">
        <div className="flex h-full items-center">
          {parsedRateAmount > 0n ? (
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
                  <span className="pt-1">{parseInt(vault.id).toString()}</span>
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
          ) : (
            <span>{parseInt(vault.id).toString()}</span>
          )}
        </div>
      </td>
      <td className="w-24 flex-shrink-0 min-[650px]:min-w-0 min-[650px]:max-w-[200px] min-[650px]:flex-1 lg:w-24 lg:max-w-none lg:flex-shrink-0 min-[1130px]:flex-1">
        {/* Mobile view - compact logos only with leverage */}
        <div className="flex items-center min-[650px]:hidden lg:flex min-[1130px]:hidden">
          <TokenImage
            address={vault.collateralToken.id}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Collateral token"
          />
          <span className="mx-1 font-normal">/</span>
          <TokenImage
            address={vault.debtToken.id}
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
                <sup className="ml-0.5 cursor-help text-[10px] font-semibold text-red">
                  {showPercent()
                    ? getRealLeverage()
                    : getLeverageRatio(vault.leverageTier)}
                </sup>
              }
            >
              <div className="text-[13px] font-medium">
                Insufficient liquidity for constant ^
                {getLeverageRatio(vault.leverageTier)} leverage
              </div>
            </HoverPopupMobile>
          ) : (
            <sup className="ml-0.5 text-[10px] font-semibold">
              {showPercent()
                ? getRealLeverage()
                : getLeverageRatio(vault.leverageTier)}
            </sup>
          )}
          {isApe && hasChart && embedUrl && (
            <div onClick={(e) => e.stopPropagation()} className="ml-2">
              <DuneChartPopup embedUrl={embedUrl} />
            </div>
          )}
        </div>

        {/* Medium view (650px to lg, and 1130px to xl) - logos + symbols + leverage */}
        <div className="hidden items-center min-[650px]:flex lg:hidden min-[1130px]:flex xl:hidden">
          <TokenImage
            address={vault.collateralToken.id}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Collateral token"
          />
          <span className="ml-1 font-normal">{vault.collateralToken.symbol ?? ''}</span>
          <span className="mx-1 font-normal">/</span>
          <TokenImage
            address={vault.debtToken.id}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Debt token"
          />
          <span className="ml-1 font-normal">{vault.debtToken.symbol ?? ''}</span>
          {variant.variant === "red" ? (
            <HoverPopupMobile
              size="200"
              alignOffset={4}
              asChild
              trigger={
                <sup className="ml-0.5 cursor-help text-[10px] font-semibold text-red">
                  {showPercent()
                    ? getRealLeverage()
                    : getLeverageRatio(vault.leverageTier)}
                </sup>
              }
            >
              <div className="text-[13px] font-medium">
                Insufficient liquidity for constant ^
                {getLeverageRatio(vault.leverageTier)} leverage
              </div>
            </HoverPopupMobile>
          ) : (
            <sup className="ml-0.5 text-[10px] font-semibold">
              {showPercent()
                ? getRealLeverage()
                : getLeverageRatio(vault.leverageTier)}
            </sup>
          )}
          {isApe && hasChart && embedUrl && (
            <div onClick={(e) => e.stopPropagation()} className="ml-2">
              <DuneChartPopup embedUrl={embedUrl} />
            </div>
          )}
        </div>

        {/* XL and above view - full names without leverage (shown in separate column) */}
        <div className="hidden items-center xl:flex">
          <TokenImage
            address={vault.collateralToken.id}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Collateral token"
          />
          <span className="ml-1 font-normal">{vault.collateralToken.symbol ?? ''}</span>
          <span className="mx-1 font-normal">/</span>
          <TokenImage
            address={vault.debtToken.id}
            className="h-6 w-6 rounded-full"
            width={28}
            height={28}
            alt="Debt token"
          />
          <span className="ml-1 font-normal">{vault.debtToken.symbol ?? ''}</span>
          {isApe && hasChart && embedUrl && (
            <div onClick={(e) => e.stopPropagation()} className="ml-2">
              <DuneChartPopup embedUrl={embedUrl} />
            </div>
          )}
        </div>
      </td>
      <td className="w-16 flex-shrink-0 pl-2 sm:w-20 sm:pl-3">
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
      <td className="hidden w-16 flex-shrink-0 pl-2 text-[13px] font-normal text-foreground/80 min-[450px]:block">
        <DisplayFormattedNumber num={POL} significant={2} />%
      </td>
      <td className="relative hidden w-20 flex-shrink-0 items-center xl:flex">
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
                ^{getLeverageRatio(vault.leverageTier)}
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
              leverageRatio={getLeverageRatio(vault.leverageTier).toString()}
            ></DisplayBadgeInfo>
          </div>
        </HoverPopupMobile>
      </td>

      <td className="flex w-20 flex-shrink-0 items-center justify-end gap-x-1 text-right min-[450px]:w-32 min-[650px]:w-24 md:w-32 lg:w-24">
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
                amountSize="small"
                amount={parseUnits(vault.totalValue, 0)}
                decimals={vault.ape.decimals}
                unitLabel={vault.collateralToken.symbol ?? ''}
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
                  unitLabel={vault.collateralToken.symbol ?? ''}
                  decimals={vault.ape.decimals}
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
                  unitLabel={vault.collateralToken.symbol ?? ''}
                  decimals={vault.ape.decimals}
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
