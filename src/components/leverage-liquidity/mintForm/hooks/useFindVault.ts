import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useVaultProvider } from "@/components/providers/vaultProvider";
import { useFormContext } from "react-hook-form";
import { z } from "zod";

export function useFindVault() {
  const form = useFormContext<TMintFormFields>();
  const { vaults: vaultQuery } = useVaultProvider();
  const formData = form.watch();
  const debtToken = formData.versus.split(",")[0] ?? "", //value formatted : address,symbol
    collateralToken = formData.long.split(",")[0] ?? ""; //value formatted : address,symbol
  const safeLeverageTier = z.coerce.number().safeParse(formData.leverageTier);
  const leverageTier = safeLeverageTier.success ? safeLeverageTier.data : -1;
  const result = vaultQuery?.vaults.find((v) => {
    if (
      v.collateralToken === collateralToken &&
      v.debtToken === debtToken &&
      leverageTier === v.leverageTier
    ) {
      return true;
    } else {
      return false;
    }
  });
  return { result };
}
