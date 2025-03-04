import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

export default function useSetDepositTokenDefault({
  collToken,
}: {
  collToken: string | undefined;
}) {
  const { setValue } = useFormContext<TMintFormFields>();
  useEffect(() => {
    setValue("depositToken", collToken ?? "");
  }, [collToken, setValue]);
}
