// In CalculatorForm.tsx
"use client";
import React from "react";
import { useFormContext } from "react-hook-form";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import { Card } from "@/components/ui/card";
import DepositInputs from "./deposit-inputs";
import PriceInputs from "./price-inputs";
import VaultParamsInputSelects from "./vaultParamsInputSelects";
import Dropdown from "@/components/shared/dropDown";
import { useFilterVaults } from "./hooks/useFilterVaults";
import useSetDepositTokenDefault from "./hooks/useSetDepositTokenDefault";
import { useFindVault } from "./hooks/useFindVault";
import useGetFormTokensInfo from "./hooks/useGetUserBals";
import Calculations from "@/components/leverage-calculator/calculatorForm/calculations";
import { api } from "@/trpc/react";
import type { TVaults } from "@/lib/types";
import useCalculateVaultHealth from "@/components/leverage-liquidity/vaultTable/hooks/useCalculateVaultHealth";
import useVaultFilterStore from "@/lib/store";
import { calculateSaturationPrice, getLeverageRatio, isVaultInPowerZone } from "@/lib/utils/calculations";
import { useMemo } from "react";

interface Props {
  vaultsQuery: TVaults; // Adjust the type as needed
  isApe?: boolean;
}

/**
 * Formats a price value for display in entry/exit price inputs.
 * Uses normal decimal notation rounded to 3 significant digits.
 */
export function formatPriceForInput(price: number): string {
  if (!Number.isFinite(price) || Number.isNaN(price) || price === 0) {
    return "0";
  }
  
  return new Intl.NumberFormat('en', {
    notation: 'standard',                 // never use exponential
    maximumSignificantDigits: 3,          // 3 significant digits
    useGrouping: false                    // no thousands separators
  }).format(price);
}

export default function CalculatorForm({ vaultsQuery }: Props) {
  const { collateralDecimals, debtDecimals } = useGetFormTokensInfo();
  const { versus, long, leverageTiers } = useFilterVaults({ vaultsQuery });
  const form = useFormContext<TCalculatorFormFields>();
  const { setValue, watch } = form;
  const setDepositToken = useVaultFilterStore((state) => state.setDepositToken);

  const selectedVault = useFindVault(vaultsQuery);

  // Ensure depositToken default is set when vault changes
  useSetDepositTokenDefault({
    collToken: selectedVault.result?.collateralToken.id,
  });

  // Fetch token pair price from Uniswap pools
  const debtToken: string = selectedVault.result?.debtToken.id ?? "";
  const collateralToken: string = selectedVault.result?.collateralToken.id ?? "";
  
  // Get the direct pool price for the token pair
  const { data: poolPrice } = api.quote.getMostLiquidPoolPrice.useQuery(
    { 
      tokenA: collateralToken,
      tokenB: debtToken,
      decimalsA: collateralDecimals,
      decimalsB: debtDecimals,
    },
    { enabled: Boolean(selectedVault.result && collateralToken && debtToken && collateralDecimals && debtDecimals) },
  );
  
  // The pool price gives us collateral price in terms of debt token
  const collateralInDebtToken = poolPrice?.price;
  const debtInCollateralToken = collateralInDebtToken ? 1 / collateralInDebtToken : undefined;

  // Watch the depositToken so that if it changes, the form values recalc.
  const depositToken = watch("depositToken");
  
  // Watch all form data
  const formData = watch();
  
  // Watch form values to get token addresses
  const formLong = watch("long");
  const formVersus = watch("versus");
  const longTokenAddress = formLong?.split(",")[0];
  const longTokenSymbol = formLong?.split(",")[1];
  const versusTokenAddress = formVersus?.split(",")[0];
  const versusTokenSymbol = formVersus?.split(",")[1];

  // Update entryPrice and exitPrice when the vault, depositToken, or token prices change
  React.useEffect(() => {
    // Only run if all form fields are selected (prevent running during partial deselection)
    const hasAllFields = formData.versus && formData.long && formData.leverageTier;
    
    if (selectedVault.result && hasAllFields) {
      setValue("deposit", "1");
      
      let entryPriceValue: string | undefined;
      let isDebtToken = false;
      if (
        depositToken &&
        depositToken === selectedVault.result.debtToken.id &&
        collateralInDebtToken
      ) {
        // If deposit token is the debt token, use inverted price (1/collateralInDebtToken)
        entryPriceValue = formatPriceForInput(1 / collateralInDebtToken);
        isDebtToken = true;
      } else if (collateralInDebtToken) {
        // Otherwise, default to collateralInDebtToken
        entryPriceValue = formatPriceForInput(collateralInDebtToken);
      }

      if (entryPriceValue) {
        const entryPrice = Number(entryPriceValue);
        // For debt tokens: exit = entry / 2 (price goes down as underlying goes up)
        // For collateral tokens: exit = entry * 2 (price goes up)
        const exitPrice = formatPriceForInput(isDebtToken ? entryPrice / 2 : entryPrice * 2);
        setValue("entryPrice", entryPriceValue);
        setValue("exitPrice", exitPrice);
      }
    } else if (!hasAllFields) {
      // Only clear values when NO fields are selected at all (initial state)
      // Don't clear when user is in process of selecting/deselecting
      if (!formData.versus && !formData.long && !formData.leverageTier) {
        setValue("entryPrice", "");
        setValue("exitPrice", "");
        setValue("deposit", "");
      }
    }
  }, [
    selectedVault.result,
    poolPrice,
    depositToken,
    collateralInDebtToken,
    debtInCollateralToken,
    setValue,
    formData.versus,
    formData.long,
    formData.leverageTier,
  ]);

  const { isLoading } = useCalculateVaultHealth({
    vaultId: Number.parseInt(selectedVault.result?.id ?? "-1"),
    isApe: true,
  });

  const disabledPriceInputs = !Boolean(selectedVault.result);
  
  // Get form values for calculations
  const leverageTier = formData.leverageTier;
  const considerLiquidity = formData.considerLiquidity ?? true;
  const liquidityMultiplier = formData.liquidityMultiplier ?? 1;
  
  // Get base reserves from vault
  const baseApeReserve = selectedVault.result ? BigInt(selectedVault.result.reserveApes || 0) : 0n;
  const baseTeaReserve = selectedVault.result ? BigInt(selectedVault.result.reserveLPers || 0) : 0n;
  
  // When liquidityMultiplier is 0, simulate an empty vault (both reserves = 0)
  // Otherwise, scale the TEA/LP reserve by the multiplier
  const apeReserve = considerLiquidity && liquidityMultiplier === 0 ? 0n : baseApeReserve;
  const teaReserve = considerLiquidity 
    ? BigInt(Math.floor(Number(baseTeaReserve) * liquidityMultiplier))
    : baseTeaReserve;
  
  
  const leverageRatio = useMemo(() => {
    return getLeverageRatio(parseFloat(leverageTier || "0"));
  }, [leverageTier]);
  
  const saturationPrice = useMemo(() => {
    // No vault selected
    if (!selectedVault.result || !collateralInDebtToken) return undefined;
    
    // Check for 0 TVL (empty vault) or 0x liquidity multiplier
    if (apeReserve === 0n && teaReserve === 0n) {
      const isDebtTokenSelected = depositToken && selectedVault.result && 
                                  depositToken === selectedVault.result.debtToken.id;
      // For empty vaults: 0 for collateral, infinity for debt token
      return isDebtTokenSelected ? Infinity : 0;
    }
    
    if (!apeReserve || !teaReserve) return undefined;
    const baseSaturationPrice = calculateSaturationPrice(collateralInDebtToken, apeReserve, teaReserve, leverageRatio);
    
    // Invert the saturation price if debt token is selected as deposit token
    const isDebtTokenSelected = depositToken && selectedVault.result &&
                                depositToken === selectedVault.result.debtToken.id;
    
    return isDebtTokenSelected && baseSaturationPrice > 0 ? 1 / baseSaturationPrice : baseSaturationPrice;
  }, [collateralInDebtToken, apeReserve, teaReserve, leverageRatio, depositToken, selectedVault.result]);
  
  const inPowerZone = useMemo(() => {
    // No vault selected
    if (!selectedVault.result) return undefined;
    
    // Empty vaults (0 TVL) are always in saturation zone
    if (apeReserve === 0n && teaReserve === 0n) return false;
    
    if (!apeReserve || !teaReserve) return undefined;
    
    // Zone is a property of the vault, not affected by which token is selected
    return isVaultInPowerZone(apeReserve, teaReserve, leverageRatio);
  }, [apeReserve, teaReserve, leverageRatio, selectedVault.result]);

  return (
    <Card>
      <form>
        {/* Vault parameters */}
        <VaultParamsInputSelects
          versus={versus}
          leverageTiers={leverageTiers}
          long={long}
        />
        <DepositInputs.Root>
          <DepositInputs.Inputs
            inputLoading={isLoading ?? false}
            disabled={false}
            decimals={collateralDecimals ?? 18}
          >
            <Dropdown.Root
              colorScheme="dark"
              name="depositToken"
              title=""
              disabled={!Boolean(longTokenAddress && versusTokenAddress)}
              onChange={setDepositToken}
            >
              {longTokenAddress && (
                <Dropdown.Item
                  tokenAddress={longTokenAddress}
                  value={longTokenAddress}
                >
                  {selectedVault.result?.collateralToken.symbol ?? longTokenSymbol ?? ""}
                </Dropdown.Item>
              )}
              {versusTokenAddress && (
                <Dropdown.Item
                  tokenAddress={versusTokenAddress}
                  value={versusTokenAddress}
                >
                  {selectedVault.result?.debtToken.symbol ?? versusTokenSymbol ?? ""}
                </Dropdown.Item>
              )}
            </Dropdown.Root>
          </DepositInputs.Inputs>
        </DepositInputs.Root>
        <PriceInputs.Root>
          <PriceInputs.EntryPrice disabled={disabledPriceInputs} />
          <PriceInputs.ExitPrice disabled={disabledPriceInputs} />
          <PriceInputs.SaturationPrice 
            disabled={disabledPriceInputs}
            saturationPrice={saturationPrice}
            inPowerZone={inPowerZone}
            isInverted={Boolean(depositToken && selectedVault.result && depositToken === selectedVault.result.debtToken.id)}
          />
        </PriceInputs.Root>
        <Calculations 
          disabled={false} 
          currentPrice={collateralInDebtToken}
          apeReserve={apeReserve}
          teaReserve={teaReserve}
        />
      </form>
    </Card>
  );
}
