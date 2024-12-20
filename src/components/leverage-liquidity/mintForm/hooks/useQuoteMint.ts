import { useDebounce } from "@/components/shared/hooks/useDebounce";
import type { TMintFormFields } from "@/lib/types";
import { api } from "@/trpc/react";

export function useQuoteMint({
  formData,
  isApe,
}: {
  isApe: boolean;
  formData: TMintFormFields;
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
  const { data: quoteData } = api.vault.quoteMint.useQuery(
    {
      amount: depositDebounce,
      isApe,
      collateralToken: formData.long.split(",")[0],
      debtToken: formData.versus.split(",")[0],
      leverageTier: parseInt(formData.leverageTier),
    },
    { enabled: allSelected },
  );
  return { quoteData };
}
