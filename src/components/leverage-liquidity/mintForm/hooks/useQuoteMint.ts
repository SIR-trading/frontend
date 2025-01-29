import { useDebounce } from "@/components/shared/hooks/useDebounce";
import type { TMintFormFields } from "@/lib/types";
import { formatDataInput } from "@/lib/utils";
import { api } from "@/trpc/react";

export function useQuoteMint({
  formData,
  isApe,
}: {
  isApe: boolean;
  formData: TMintFormFields;
  decimals: number;
}) {
  const allSelected = Boolean(
    formData.deposit &&
      formData.long !== "" &&
      formData.versus !== "" &&
      formData.leverageTier !== "",
  );
  const { debouncedValue: depositDebounce } = useDebounce(
    formData.deposit,
    500,
  );

  const usingDebtToken =
    formData.depositToken === formatDataInput(formData.versus) &&
    formData.depositToken !== "";
  const { data: quoteData } = api.vault.quoteMint.useQuery(
    {
      amount: depositDebounce,
      usingDebtToken: usingDebtToken,
      isApe,
      collateralToken: formData.long.split(",")[0],
      debtToken: formData.versus.split(",")[0],
      leverageTier: parseInt(formData.leverageTier),
    },
    { enabled: allSelected },
  );
  return { amountTokens: quoteData?.[0], minCollateralOut: quoteData?.[1] };
}
