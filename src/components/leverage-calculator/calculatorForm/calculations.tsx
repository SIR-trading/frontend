import React, { useMemo, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import useFormFee from "@/components/leverage-calculator/calculatorForm/hooks/useFormFee";
import useIsDebtToken from "@/components/leverage-calculator/calculatorForm/hooks/useIsDebtToken";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { calculateCollateralGainWithLiquidity, calculateSaturationPrice, getLeverageRatio } from "@/lib/utils/calculations";
import { useFindVault } from "./hooks/useFindVault";
import { Checkbox } from "@/components/ui/checkbox";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import LiquiditySlider from "./liquiditySlider";
import ToolTip from "@/components/ui/tooltip";

export default function Calculations({
  disabled,
  currentPrice,
  apeReserve: propsApeReserve,
  teaReserve: propsTeaReserve,
}: {
  disabled: boolean;
  currentPrice?: number;
  apeReserve?: bigint;
  teaReserve?: bigint;
}) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();

  //  Check for the required fields
  const areRequiredValuesPresent = useMemo(() => {
    return formData.depositToken && formData.versus && formData.leverageTier;
  }, [formData.depositToken, formData.versus, formData.leverageTier]);

  const isDebtToken = useIsDebtToken();

  // Get vaults from provider (only for fallback if props not provided)
  const { vaults: vaultsQuery } = useVaultProvider();

  // Get the selected vault to fetch reserve data (only for fallback)
  const selectedVault = useFindVault(vaultsQuery);

  // Use reserves from props when provided (parent handles liquidity multiplier)
  // Only calculate as fallback when props are not provided
  const baseApeReserve =
    propsApeReserve ??
    (selectedVault.result ? BigInt(selectedVault.result.reserveApes || 0) : 0n);
  const baseTeaReserve =
    propsTeaReserve ??
    (selectedVault.result
      ? BigInt(selectedVault.result.reserveLPers || 0)
      : 0n);

  // Use the currentPrice passed from parent component (calculatorForm.tsx)
  const marketPrice = currentPrice ?? 0;

  // Extract fee
  const strFee = useFormFee({
    leverageTier: formData.leverageTier,
    isApe: true,
  });
  const fee = Number(strFee);

  // Calculate adjusted reserves if "Consider deposit" is checked
  const depositAmount = Number(formData.deposit ?? 0);
  const depositInCollateral = isDebtToken
    ? depositAmount / Number(formData.entryPrice ?? 1)
    : depositAmount;
  const feeAmount = depositInCollateral * (fee / 100);
  const depositAfterFee = depositInCollateral - feeAmount;

  // Get vault decimals (fallback to 18 if not available)
  const vaultDecimals = selectedVault.result?.collateralToken?.decimals ?? 18;

  // Adjust reserves based on deposit if both considerLiquidity and considerDeposit are true
  const shouldConsiderDeposit =
    (formData.considerLiquidity ?? true) &&
    (formData.considerDeposit ?? false) &&
    depositInCollateral > 0;

  const apeReserve = shouldConsiderDeposit
    ? baseApeReserve +
      BigInt(Math.floor(depositAfterFee * Math.pow(10, vaultDecimals))) // Adding deposit minus fee to ape reserve
    : baseApeReserve;

  const teaReserve = shouldConsiderDeposit
    ? baseTeaReserve +
      BigInt(Math.floor(feeAmount * Math.pow(10, vaultDecimals))) // Adding fee to tea reserve
    : baseTeaReserve;

  // Log the reserve changes and saturation price
  if (formData.considerLiquidity) {
    if (shouldConsiderDeposit) {
      const baseApeFormatted = Number(baseApeReserve) / Math.pow(10, vaultDecimals);
      const baseTeaFormatted = Number(baseTeaReserve) / Math.pow(10, vaultDecimals);
      const adjustedApeFormatted = Number(apeReserve) / Math.pow(10, vaultDecimals);
      const adjustedTeaFormatted = Number(teaReserve) / Math.pow(10, vaultDecimals);

      // Calculate leverage ratio for saturation price
      const leverageValue = parseFloat(formData.leverageTier || "0");
      const leverageRatio = getLeverageRatio(leverageValue);

      // Calculate saturation prices (need to pass currentPrice as first parameter)
      const baseSaturationPrice = calculateSaturationPrice(
        marketPrice,
        baseApeReserve,
        baseTeaReserve,
        leverageRatio
      );
      const adjustedSaturationPrice = calculateSaturationPrice(
        marketPrice,
        apeReserve,
        teaReserve,
        leverageRatio
      );
      const saturationPriceChange = adjustedSaturationPrice - baseSaturationPrice;
      const saturationPriceChangePerc = (saturationPriceChange / baseSaturationPrice) * 100;

      console.log("📊 Reserve Impact Analysis:", {
        "📍 Deposit Info": {
          depositAmount,
          depositInCollateral,
          feePercentage: `${fee}%`,
          feeAmount,
          depositAfterFee,
        },
        "🔵 Base Reserves (Before Deposit)": {
          apeReserve: baseApeFormatted,
          teaReserve: baseTeaFormatted,
          totalTVL: baseApeFormatted + baseTeaFormatted,
          apeRatio: `${((baseApeFormatted / (baseApeFormatted + baseTeaFormatted)) * 100).toFixed(2)}%`,
          saturationPrice: baseSaturationPrice,
        },
        "🟢 Adjusted Reserves (After Deposit)": {
          apeReserve: adjustedApeFormatted,
          teaReserve: adjustedTeaFormatted,
          totalTVL: adjustedApeFormatted + adjustedTeaFormatted,
          apeRatio: `${((adjustedApeFormatted / (adjustedApeFormatted + adjustedTeaFormatted)) * 100).toFixed(2)}%`,
          saturationPrice: adjustedSaturationPrice,
        },
        "📈 Changes": {
          apeChange: `+${depositAfterFee} (${((depositAfterFee / baseApeFormatted) * 100).toFixed(2)}% increase)`,
          teaChange: `+${feeAmount} (${((feeAmount / baseTeaFormatted) * 100).toFixed(2)}% increase)`,
          depositAsPercentOfTVL: `${((depositInCollateral / (baseApeFormatted + baseTeaFormatted)) * 100).toFixed(2)}%`,
          saturationPriceChange: `${saturationPriceChange > 0 ? '+' : ''}${saturationPriceChange.toFixed(6)} (${saturationPriceChangePerc > 0 ? '+' : ''}${saturationPriceChangePerc.toFixed(2)}%)`,
        },
        "🎯 Saturation Analysis": {
          leverageRatio,
          beforeDeposit: {
            saturationPrice: baseSaturationPrice,
            currentToSaturationRatio: marketPrice / baseSaturationPrice,
          },
          afterDeposit: {
            saturationPrice: adjustedSaturationPrice,
            currentToSaturationRatio: marketPrice / adjustedSaturationPrice,
          },
          impact: `Saturation price ${saturationPriceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(saturationPriceChangePerc).toFixed(2)}%`,
        }
      });
    } else {
      const apeFormatted = Number(apeReserve) / Math.pow(10, vaultDecimals);
      const teaFormatted = Number(teaReserve) / Math.pow(10, vaultDecimals);

      // Calculate leverage ratio and saturation price
      const leverageValue = parseFloat(formData.leverageTier || "0");
      const leverageRatio = getLeverageRatio(leverageValue);
      const saturationPrice = calculateSaturationPrice(
        marketPrice,
        apeReserve,
        teaReserve,
        leverageRatio
      );

      console.log("📊 Current Liquidity (No Deposit Impact):", {
        apeReserve: apeFormatted,
        teaReserve: teaFormatted,
        totalTVL: apeFormatted + teaFormatted,
        apeRatio: `${((apeFormatted / (apeFormatted + teaFormatted)) * 100).toFixed(2)}%`,
        saturationPrice,
        currentToSaturationRatio: marketPrice / saturationPrice,
      });
    }
  }

  // Make sure entryPrice and exitPrice are provided to avoid calculation errors.
  const entryPrice = isDebtToken
    ? 1 / Number(formData.entryPrice)
    : Number(formData.entryPrice);
  const exitPrice = isDebtToken
    ? 1 / Number(formData.exitPrice)
    : Number(formData.exitPrice);

  // Check if vault has 0 TVL
  const isEmptyVault = apeReserve === 0n && teaReserve === 0n;

  // Calculate positions using the provided values.
  // Use liquidity-aware calculation if considerLiquidity is checked
  // Note: The form already provides inverted prices for debt tokens, so we use them as-is
  // For empty vaults with considerLiquidity on, gains should be 0
  const rawCollateralGain = !areRequiredValuesPresent
    ? 0
    : isEmptyVault && (formData.considerLiquidity ?? true)
      ? 1 // Return 1 which means 0% gain (1 - 1 = 0)
      : (() => {
          return calculateCollateralGainWithLiquidity(
            entryPrice,
            exitPrice,
            marketPrice,
            parseFloat(formData.leverageTier || "0"),
            apeReserve,
            teaReserve,
            formData.considerLiquidity ?? true,
          );
        })();

  const collateralGain: number = (1 - fee / 100) * rawCollateralGain;

  const debtTokenGain: number = collateralGain * (exitPrice / entryPrice);

  const collateralGainPerc = (collateralGain - 1) * 100;
  const debtTokenGainPerc = (debtTokenGain - 1) * 100;

  // Extracts the ticker form the token string - must be before any returns
  const ticker = useCallback((token: string) => token.split(",")[1], []);

  // If the required values are not present, show a placeholder
  if (!areRequiredValuesPresent) {
    return (
      <div className="flex h-40 items-center justify-center">
        Please complete all required fields to display calculations.
      </div>
    );
  }

  interface IAmounts {
    collateralGain: number;
    collateralGainPerc: number;
    debtTokenGain: number;
    debtTokenGainPerc: number;
  }

  const amounts: IAmounts = (() => {
    if (isNaN(Number(formData.deposit)))
      return {
        collateralGain: 0,
        collateralGainPerc: 0,
        debtTokenGain: 0,
        debtTokenGainPerc: 0,
      };
    if (Number(formData.deposit) === 0 || (entryPrice === 0 && exitPrice === 0))
      return {
        collateralGain: 0,
        collateralGainPerc: 0,
        debtTokenGain: 0,
        debtTokenGainPerc: 0,
      };
    else if (entryPrice === 0 && exitPrice !== 0)
      return {
        collateralGain: Infinity,
        collateralGainPerc: Infinity,
        debtTokenGain: Infinity,
        debtTokenGainPerc: Infinity,
      };
    else if (entryPrice !== 0 && exitPrice === 0)
      return {
        collateralGain: 0,
        collateralGainPerc: -100,
        debtTokenGain: 0,
        debtTokenGainPerc: -100,
      };
    return {
      collateralGain:
        Number(formData.deposit) *
        (isDebtToken ? 1 / entryPrice : 1) *
        collateralGain,
      collateralGainPerc: collateralGainPerc,
      debtTokenGain:
        Number(formData.deposit) *
        (isDebtToken ? 1 : entryPrice) *
        debtTokenGain,
      debtTokenGainPerc: debtTokenGainPerc,
    };
  })();

  return (
    <div className={`mt-4 ${disabled ? "opacity-50" : ""}`}>
      <div className="mb-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="considerLiquidity"
            checked={formData.considerLiquidity ?? true}
            onCheckedChange={(checked) => {
              form.setValue("considerLiquidity", checked === true);
              if (!checked) {
                form.setValue("considerDeposit", false);
              }
            }}
            className="border-foreground/50"
          />
          <label
            htmlFor="considerLiquidity"
            className="cursor-pointer text-sm text-foreground/80"
          >
            Consider current liquidity
          </label>
          <ToolTip size="300">
            As leveraged positions grow, LP fees increase, attracting more
            liquidity to the vault. Use the slider to simulate different
            liquidity levels.
          </ToolTip>
        </div>

        {(formData.considerLiquidity ?? true) && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="considerDeposit"
              checked={formData.considerDeposit ?? false}
              onCheckedChange={(checked) => {
                form.setValue("considerDeposit", checked === true);
              }}
              className="border-foreground/50"
            />
            <label
              htmlFor="considerDeposit"
              className="cursor-pointer text-sm text-foreground/80"
            >
              Consider deposit impact
            </label>
            <ToolTip size="300">
              Accounts for how your deposit will change the vault&apos;s liquidity.
            </ToolTip>
          </div>
        )}
      </div>
      {(formData.considerLiquidity ?? true) && (
        <div className="mb-4">
          <LiquiditySlider
            value={formData.liquidityMultiplier ?? 1}
            onChange={(value) => {
              form.setValue("liquidityMultiplier", value);
            }}
            disabled={disabled || !selectedVault.result}
          />
        </div>
      )}
      <div className="pt-3"></div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-md">
          <h3 className="text-md">
            <span className="text-gray-300 text-sm">
              Returns in <span>{ticker(formData.long)}</span>:
            </span>
          </h3>
          <div className="text-md space-x-1">
            <span>
              <DisplayFormattedNumber num={amounts.collateralGain} />
            </span>
            <span
              className={
                amounts.collateralGainPerc < 0 ? "text-red" : "text-accent"
              }
            >
              ({amounts.collateralGainPerc > 0 ? "+" : ""}
              <DisplayFormattedNumber num={amounts.collateralGainPerc} />
              %)
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md">
          <h3 className="text-md">
            <span className="text-gray-300 text-sm">
              Returns in <span>{ticker(formData.versus)}</span>:
            </span>
          </h3>
          <div className="text-md space-x-1">
            <span>
              <DisplayFormattedNumber num={amounts.debtTokenGain} />
            </span>
            <span
              className={
                amounts.debtTokenGainPerc < 0 ? "text-red" : "text-accent"
              }
            >
              ({amounts.debtTokenGainPerc > 0 ? "+" : ""}
              <DisplayFormattedNumber num={amounts.debtTokenGainPerc} />
              %)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
