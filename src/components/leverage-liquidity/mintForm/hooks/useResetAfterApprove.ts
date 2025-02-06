import { ESubmitType } from "@/lib/types";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
interface Props {
  isConfirmed: boolean;
  reset: () => void;
  submitType: ESubmitType;
}
/**
 * Invalidates user balance query.
 */
export function useResetAfterApprove({
  isConfirmed,
  reset,
  submitType,
}: Props) {
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (submitType === ESubmitType.approve) {
      setIsApproving(true);
    }
  }, [submitType]);

  const utils = api.useUtils();
  useEffect(() => {
    if (isConfirmed && isApproving) {
      utils.user.getBalanceAndAllowance
        .invalidate()
        .then(() => {
          reset();
          setIsApproving(false);
        })
        .catch((e) => console.log(e));
    }
  }, [
    isApproving,
    reset,
    isConfirmed,
    setIsApproving,
    utils.user.getBalanceAndAllowance,
  ]);
  return isApproving;
}
