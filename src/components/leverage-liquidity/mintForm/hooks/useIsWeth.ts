import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { WETH_ADDRESS } from "@/data/constants";
import { useFormContext } from "react-hook-form";

export function useIsWeth() {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const isWeth =
    formData.depositToken?.toLowerCase() === WETH_ADDRESS.toLowerCase();
  return isWeth;
}
