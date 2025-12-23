import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useDebounce } from "@/components/shared/hooks/useDebounce";
import { formatDataInput } from "@/lib/utils/index";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";

export function useQuoteMint({
  isApe,
  decimals,
}: {
  isApe: boolean;
  decimals: number;
}) {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();

  const { debouncedValue: depositDebounce } = useDebounce(
    formData.deposit,
    500,
  );

  const allSelected = Boolean(
    depositDebounce &&
      parseFloat(depositDebounce) > 0 &&
      formData.long !== "" &&
      formData.versus !== "" &&
      formData.leverageTier !== "" &&
      decimals > 0, // Ensure decimals are loaded before querying
  );

  const usingDebtToken =
    formData.depositToken === formatDataInput(formData.versus) &&
    formData.depositToken !== "";

  // Validate all parameters before enabling the query
  const collateralToken = formData.long.split(",")[0];
  const debtToken = formData.versus.split(",")[0];
  const leverageTier = parseInt(formData.leverageTier);

  // Ensure all parameters are valid
  const hasValidParams = Boolean(
    collateralToken?.startsWith("0x") &&
    debtToken?.startsWith("0x") &&
    !isNaN(leverageTier) &&
    depositDebounce &&
    parseFloat(depositDebounce) > 0
  );

  const { data: quoteData, error } = api.vault.quoteMint.useQuery(
    {
      amount: depositDebounce,
      decimals,
      usingDebtToken: usingDebtToken,
      isApe,
      collateralToken,
      debtToken,
      leverageTier,
    },
    {
      enabled: allSelected && hasValidParams,
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      retry: false, // Don't retry on error - the contract revert is likely deterministic
    },
  );

  // Log errors for debugging (contract reverts like AmountTooLow, VaultDoesNotExist)
  if (error) {
    console.warn("quoteMint error:", {
      error: error.message,
      params: { collateralToken, debtToken, leverageTier, amount: depositDebounce, decimals, usingDebtToken, isApe }
    });
  }

  return {
    amountTokens: quoteData?.[0],
    amountCollateral: quoteData?.[1], // actual amount with current slippage
    amountCollateralIdeal: quoteData?.[2], // ideal amount without slippage
  };
}
