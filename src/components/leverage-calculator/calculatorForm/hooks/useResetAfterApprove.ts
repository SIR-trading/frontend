import { api } from "@/trpc/react";
import { useEffect } from "react";
interface Props {
  isConfirmed: boolean;
  reset: () => void;
  needsApproval: boolean;
}
/**
 * Invalidates user balance query.
 */
export function useResetAfterApprove({
  isConfirmed,
  reset,
  needsApproval,
}: Props) {
  const utils = api.useUtils();
  useEffect(() => {
    if (isConfirmed && needsApproval) {
      reset();
      utils.user.getBalanceAndAllowance
        .invalidate()
        .catch((e) => console.log(e));
    }
  }, [reset, isConfirmed, utils.user.getBalanceAndAllowance, needsApproval]);
}
