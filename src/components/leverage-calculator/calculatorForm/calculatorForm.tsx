"use client";
import React, { useCallback, useMemo, useState } from "react";
import { formatUnits } from "viem";
import { type TVaults } from "@/lib/types";
import DepositInputs from "./deposit-inputs";
import PriceInputs from "./price-inputs";
import VaultParamsInputSelects from "./vaultParamsInputSelects";
import { useQuoteMint } from "./hooks/useQuoteMint";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { useCalculateMaxApe } from "./hooks/useCalculateMaxApe";
import { useFilterVaults } from "./hooks/useFilterVaults";
import Dropdown from "@/components/shared/dropDown";
import { useIsWeth } from "./hooks/useIsWeth";
import useSetDepositTokenDefault from "./hooks/useSetDepositTokenDefault";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import { useFormContext } from "react-hook-form";
import { useFindVault } from "./hooks/useFindVault";
import useIsDebtToken from "./hooks/useIsDebtToken";
import useGetFormTokensInfo from "./hooks/useGetUserBals";
import { Input } from "@/components/ui/input";
import Calculations from "@/components/leverage-calculator/calculatorForm/calculations";

interface Props {
  vaultsQuery: TVaults;
  isApe: boolean;
}

/**
 * Contains form actions and validition.
 */
export default function CalculatorForm({ vaultsQuery, isApe }: Props) {
  const [useEthRaw, setUseEth] = useState(false);
  const {
    userEthBalance,
    userBalanceFetching,
    userBalance,
    debtDecimals,
    collateralDecimals,
    depositDecimals,
  } = useGetFormTokensInfo();
  const isWeth = useIsWeth();
  const { versus, long, leverageTiers } = useFilterVaults({ vaultsQuery });

  // Ensure use eth toggle is not used on non-weth tokens
  const { setError, formState, setValue, watch, handleSubmit } =
    useFormContext<TCalculatorFormFields>();
  const { deposit, leverageTier, long: longInput } = watch();
  const useEth = useMemo(() => {
    return isWeth ? useEthRaw : false;
  }, [isWeth, useEthRaw]);

  const { amountTokens, minCollateralOut } = useQuoteMint({
    isApe,
    decimals: debtDecimals ?? 0,
  });

  const selectedVault = useFindVault(vaultsQuery);

  useSetDepositTokenDefault({
    collToken: selectedVault.result?.collateralToken,
  });

  const usingDebtToken = useIsDebtToken();
  const { maxCollateralIn, maxDebtIn, badHealth, isLoading } =
    useCalculateMaxApe({
      usingDebtToken,
      collateralDecimals: collateralDecimals ?? 18,
      vaultId: Number.parseInt(selectedVault.result?.vaultId ?? "-1"),
    });
  const maxIn = usingDebtToken ? maxDebtIn : maxCollateralIn;

  const onSubmit = useCallback(() => {
    console.log("submit");
  }, []);

  const disabledInputs = useMemo(() => {
    if (!selectedVault.result?.vaultId) {
      setValue("deposit", "");
      return false;
    }
    if (badHealth) {
      return true;
    }
  }, [selectedVault.result?.vaultId, badHealth, setValue]);

  const depositTokenSymbol = !usingDebtToken
    ? selectedVault.result?.collateralSymbol
    : selectedVault.result?.debtSymbol;
  const maxTokenIn = usingDebtToken
    ? formatUnits(maxDebtIn ?? 0n, debtDecimals ?? 18)
    : formatUnits(maxCollateralIn ?? 0n, collateralDecimals ?? 18);

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Versus, Long, and Leverage Dropdowns */}
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
        <PriceInputs.Root label="Entry price">
          <PriceInputs.EntryPrice disabled={false}>
            <Input type="number" name="deposit" placeholder="0" />
          </PriceInputs.EntryPrice>
          <PriceInputs.ExitPrice disabled={false}>
            <Input type="number" name="deposit" placeholder="0" />
          </PriceInputs.ExitPrice>
        </PriceInputs.Root>
        <Calculations
            disabled={false}
            leverageTier={leverageTier}
        />

      </form>
    </Card>
  );
}
