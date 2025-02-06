import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useDebounce } from "@/components/shared/hooks/useDebounce";
import { formatDataInput } from "@/lib/utils";
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
      decimals,
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
