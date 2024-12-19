import type { TMintFormFields } from "@/lib/types";
import { api } from "@/trpc/react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
interface Props {
  isConfirming: boolean;
  isConfirmed: boolean;
  currentTxType: "mint" | "approve" | undefined;
  useEth: boolean;
}
export function useFormSuccessReset({
  isConfirmed,
  isConfirming,
  currentTxType,
  useEth,
}: Props) {
  const form = useFormContext<TMintFormFields>();

  const utils = api.useUtils();
  useEffect(() => {
    if (
      isConfirmed &&
      !useEth &&
      form.getValues("deposit") &&
      currentTxType === "mint"
    ) {
      form.resetField("deposit");
      utils.user.getBalance.invalidate().catch((e) => console.log(e));
    }

    if (isConfirmed && useEth && form.getValues("deposit")) {
      form.resetField("deposit");
      utils.user.getEthBalance.invalidate().catch((e) => console.log(e));
      utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
    }
  }, [
    isConfirming,
    isConfirmed,
    utils.user.getBalance,
    utils.user.getEthBalance,
    currentTxType,
    useEth,
    form,
    utils.vault.getTableVaults,
  ]);
}
