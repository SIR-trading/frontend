import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { subgraphSyncPoll } from "@/lib/utils/sync";
import { api } from "@/trpc/react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
interface Props {
  isConfirmed: boolean;
  currentTxType: "mint" | "approve" | "create-vault" | undefined;
  useNativeToken: boolean;
  txBlock?: number;
}
export function useFormSuccessReset({
  isConfirmed,
  currentTxType,
  useNativeToken,
  txBlock,
}: Props) {
  const form = useFormContext<TMintFormFields>();

  const utils = api.useUtils();
  useEffect(() => {
    if (isConfirmed && !useNativeToken && currentTxType === "create-vault") {
      subgraphSyncPoll(txBlock)
        .then(() => {
          utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
      return;
    }
    if (
      isConfirmed &&
      !useNativeToken &&
      form.getValues("deposit") &&
      currentTxType === "mint"
    ) {
      form.resetField("deposit");
      utils.user.getBalanceAndAllowance
        .invalidate()
        .catch((e) => console.log(e));
      utils.vault.getReserve.invalidate().catch((e) => console.log(e));
      subgraphSyncPoll(txBlock)
        .then(() => {
          utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
    }

    if (isConfirmed && useNativeToken && form.getValues("deposit")) {
      form.resetField("deposit");
      utils.user.getNativeTokenBalance.invalidate().catch((e) => console.log(e));
      utils.vault.getReserve.invalidate().catch((e) => console.log(e));
      subgraphSyncPoll(txBlock)
        .then(() => {
          utils.vault.getTableVaults.invalidate().catch((e) => console.log(e));
        })
        .catch((e) => console.log(e));
    }
  }, [
    isConfirmed,
    utils.user.getBalanceAndAllowance,
    utils.user.getNativeTokenBalance,
    currentTxType,
    useNativeToken,
    form,
    utils.vault.getTableVaults,
    txBlock,
    utils.vault.getReserve,
  ]);
}
