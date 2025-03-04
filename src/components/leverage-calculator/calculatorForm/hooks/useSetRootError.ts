import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useEffect } from "react";
import { useFormContext, type UseFormSetError } from "react-hook-form";
/**
 * useSetRootError
 * Helper hook to set forms root error.
 * Ensures all form fields are set before setting root error.
 */
export default function useSetRootError({
  setError,
  errorMessage,
  rootErrorMessage,
}: {
  errorMessage: string | null;
  setError: UseFormSetError<TMintFormFields>;
  rootErrorMessage: string | undefined;
}) {
  // ONLY SET ERROR IF ALL VALUES SET IN FORM

  const formData = useFormContext<TMintFormFields>().watch();
  useEffect(() => {
    if (
      errorMessage &&
      formData.deposit &&
      formData.leverageTier &&
      formData.long &&
      formData.versus
    ) {
      setError("root", { message: errorMessage });
    } else if (rootErrorMessage) {
      setError("root", { message: "" });
    }
  }, [
    errorMessage,
    formData.deposit,
    formData.depositToken,
    formData.leverageTier,
    formData.long,
    formData.versus,
    rootErrorMessage,
    setError,
  ]);
}
