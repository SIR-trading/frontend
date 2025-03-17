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
import Show from "@/components/shared/show";
import { useFilterVaults } from "./hooks/useFilterVaults";
import useSetDepositTokenDefault from "./hooks/useSetDepositTokenDefault";
import { useFindVault } from "./hooks/useFindVault";
import useIsDebtToken from "./hooks/useIsDebtToken";
import useGetFormTokensInfo from "./hooks/useGetUserBals";
import Calculations from "@/components/leverage-calculator/calculatorForm/calculations";
import { api } from "@/trpc/react";
import type { TVaults } from "@/lib/types";
import { useCalculateMaxApe } from "@/components/leverage-liquidity/mintForm/hooks/useCalculateMaxApe";

interface Props {
  vaultsQuery: TVaults; // Adjust the type as needed
  isApe?: boolean;
}

export default function CalculatorForm({ vaultsQuery }: Props) {
  const { collateralDecimals } = useGetFormTokensInfo();
  const { versus, long, leverageTiers } = useFilterVaults({ vaultsQuery });
  const { setValue, watch } = useFormContext<TCalculatorFormFields>();

  const selectedVault = useFindVault(vaultsQuery);

  // Ensure depositToken default is set when vault changes
  useSetDepositTokenDefault({
    collToken: selectedVault.result?.collateralToken,
  });

  // Fetch token prices using the vault's symbols.
  const debtToken = selectedVault.result?.debtSymbol ?? "USDC";
  const collateralToken = selectedVault.result?.collateralSymbol ?? "ETH";
  const { data: tokens } = api.price.getVaultPrices.useQuery(
    { debtToken, collateralToken },
    { enabled: Boolean(selectedVault.result) },
  );

  // Calculate the prices for both conversion directions.
  const collateralPrice = tokens?.data[0]?.prices[0]?.value
    ? Number(tokens.data[0].prices[0].value)
    : undefined;
  const debtPrice = tokens?.data[1]?.prices[0]?.value
    ? Number(tokens.data[1].prices[0].value)
    : undefined;

  const collateralInDebtToken =
    collateralPrice && debtPrice ? collateralPrice / debtPrice : undefined;
  const debtInCollateralToken =
    collateralPrice && debtPrice ? debtPrice / collateralPrice : undefined;

  // Watch the depositToken so that if it changes, the form values recalc.
  const depositToken = watch("depositToken");

  // Update entryPrice and exitPrice when the vault, depositToken, or token prices change
  React.useEffect(() => {
    let entryPriceValue: string | undefined;
    if (
      depositToken &&
      selectedVault.result &&
      depositToken === selectedVault.result.debtToken &&
      debtInCollateralToken
    ) {
      // If deposit token is the debt token, use converted debtInCollateralToken value
      entryPriceValue = debtInCollateralToken.toFixed(6);
    } else if (collateralInDebtToken) {
      // Otherwise, default to collateralInDebtToken
      entryPriceValue = collateralInDebtToken.toFixed(6);
    }

    if (entryPriceValue) {
      const entryPrice = Number(entryPriceValue);
      const exitPrice = (entryPrice * 2).toFixed(6);
      setValue("entryPrice", entryPriceValue);
      setValue("exitPrice", exitPrice);
      setValue("deposit", "1");
    } else {
      // Reset values if we don't have a proper price yet.
      setValue("entryPrice", "");
      setValue("exitPrice", "");
    }
  }, [
    selectedVault.result,
    tokens,
    depositToken,
    collateralInDebtToken,
    debtInCollateralToken,
    setValue,
  ]);

  const usingDebtToken = useIsDebtToken();
  const { isLoading } = useCalculateMaxApe({
    usingDebtToken,
    collateralDecimals: collateralDecimals ?? 18,
    vaultId: Number.parseInt(selectedVault.result?.vaultId ?? "-1"),
  });

  const disabledPriceInputs = !Boolean(selectedVault.result);

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
            inputLoading={isLoading}
            disabled={false}
            decimals={collateralDecimals ?? 18}
          >
            <Dropdown.Root
              colorScheme="dark"
              name="depositToken"
              title=""
              disabled={!Boolean(selectedVault.result)}
            >
              <Show when={Boolean(selectedVault.result)}>
                <Dropdown.Item
                  tokenAddress={selectedVault.result?.collateralToken ?? ""}
                  value={selectedVault.result?.collateralToken ?? ""}
                >
                  {selectedVault.result?.collateralSymbol}
                </Dropdown.Item>
                <Dropdown.Item
                  tokenAddress={selectedVault.result?.debtToken ?? ""}
                  value={selectedVault.result?.debtToken ?? ""}
                >
                  {selectedVault.result?.debtSymbol}
                </Dropdown.Item>
              </Show>
            </Dropdown.Root>
          </DepositInputs.Inputs>
        </DepositInputs.Root>
        <PriceInputs.Root>
          <PriceInputs.EntryPrice disabled={disabledPriceInputs} />
          <PriceInputs.ExitPrice disabled={disabledPriceInputs} />
        </PriceInputs.Root>
        <Calculations disabled={false} />
      </form>
      {selectedVault.result && (
        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
          This calculator assumes sufficient liquidity from LPs to support the
          shown price increases.
        </div>
      )}
    </Card>
  );
}
