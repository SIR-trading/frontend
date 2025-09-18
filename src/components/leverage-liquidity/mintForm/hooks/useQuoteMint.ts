import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useDebounce } from "@/components/shared/hooks/useDebounce";
import { formatDataInput } from "@/lib/utils/index";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";
import React from "react";

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
      formData.leverageTier !== "",
  );

  const usingDebtToken =
    formData.depositToken === formatDataInput(formData.versus) &&
    formData.depositToken !== "";

  const { data: quoteData, error, isFetching } = api.vault.quoteMint.useQuery(
    {
      amount: depositDebounce,
      decimals,
      usingDebtToken: usingDebtToken,
      isApe,
      collateralToken: formData.long.split(",")[0],
      debtToken: formData.versus.split(",")[0],
      leverageTier: parseInt(formData.leverageTier),
    },
    {
      enabled: allSelected,
      staleTime: 30 * 1000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch when component mounts if data exists
    },
  );

  // Only log when actually fetching (not from cache)
  React.useEffect(() => {
    if (isFetching && allSelected) {
      console.log("💰 Quote call triggered:", {
        timestamp: new Date().toISOString(),
        amount: depositDebounce,
        decimals,
        usingDebtToken,
        isApe,
        collateralToken: formData.long.split(",")[0],
        debtToken: formData.versus.split(",")[0],
        leverageTier: parseInt(formData.leverageTier),
      });
    }
  }, [isFetching]);

  React.useEffect(() => {
    if (error) {
      console.error("❌ quoteMint failed:", error);
    } else if (quoteData && !isFetching) {
      console.log("✅ Quote result (quoteMintWithDebtToken):", {
        amountTokens: quoteData[0]?.toString(),
        amountCollateral: quoteData[1]?.toString(),  // actual with slippage
        amountCollateralIdeal: quoteData[2]?.toString(),  // ideal without slippage
        usingDebtToken,
        isApe
      });
    }
  }, [quoteData, error, isFetching, usingDebtToken, isApe]);

  return {
    amountTokens: quoteData?.[0],
    amountCollateral: quoteData?.[1],  // actual amount with current slippage
    amountCollateralIdeal: quoteData?.[2]  // ideal amount without slippage
  };
}
