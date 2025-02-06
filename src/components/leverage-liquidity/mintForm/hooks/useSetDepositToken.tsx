import type {
  TMintForm,
  TMintFormFields,
} from "@/components/providers/mintFormProvider";
import { useEffect, useState } from "react";
/**
 * useSetDepositToken
 * Set DepositToken input values using selected long and versus values.
 */
export default function useSetDepositToken({
  formData,
  form,
}: {
  formData: TMintFormFields;
  form: TMintForm;
}) {
  const [tokenDeposits, setTokenDeposits] = useState<{
    versus: { value: string; label: string } | undefined;
    long: { value: string; label: string } | undefined;
  }>({ long: undefined, versus: undefined });
  useEffect(() => {
    if (formData.versus) {
      if (formData.versus !== tokenDeposits?.versus?.value) {
        setTokenDeposits((s) => ({
          ...s,
          versus: {
            value: formData.versus,
            label: formData.versus.split(",")[1] ?? "",
          },
        }));
        form.setValue("depositToken", formData.versus);
      }
    }
    if (!formData.versus) {
      setTokenDeposits((s) => ({ ...s, versus: undefined }));
      form.setValue("depositToken", "");
    }
    if (!formData.long) {
      setTokenDeposits((s) => ({ ...s, long: undefined }));
    }
    if (formData.long) {
      if (formData.long !== tokenDeposits?.long?.value) {
        setTokenDeposits((s) => ({
          ...s,
          long: {
            value: formData.long,
            label: formData.long.split(",")[1] ?? "",
          },
        }));
      }
    }
  }, [
    formData.long,
    formData.versus,
    tokenDeposits.versus,
    tokenDeposits.long,
    form,
  ]);
  return { tokenDeposits };
}
