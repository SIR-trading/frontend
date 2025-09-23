import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import type { TVaults } from "@/lib/types";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function useFindVault(vaultQuery: TVaults) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();

  // Don't search if any field is missing
  if (!formData.versus || !formData.long || !formData.leverageTier) {
    return { result: undefined };
  }

  const debtToken = formData.versus.split(",")[0] ?? ""; //value formatted : address,symbol
  const collateralToken = formData.long.split(",")[0] ?? ""; //value formatted : address,symbol
  const safeLeverageTier = z.coerce.number().safeParse(formData.leverageTier);
  const leverageTier = safeLeverageTier.success ? safeLeverageTier.data : -1;

  const result = vaultQuery?.vaults.find((v) => {
    if (
      v.collateralToken.id === collateralToken &&
      v.debtToken.id === debtToken &&
      leverageTier === v.leverageTier
    ) {
      return true;
    } else {
      return false;
    }
  });
  
  return { result };
}
