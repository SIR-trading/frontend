import { api } from "@/trpc/react";
import { useEffect, useRef } from "react";
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

  // Use a ref to ensure we only run the effect once per approval confirmation
  // This prevents infinite loops from query invalidation triggering re-renders
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (isConfirmed && needsApproval && !hasExecutedRef.current) {
      hasExecutedRef.current = true;
      reset();
      utils.user.getBalanceAndAllowance
        .invalidate()
        .catch((e) => console.log(e));
    }

    // Reset the flag when conditions change
    if (!isConfirmed || !needsApproval) {
      hasExecutedRef.current = false;
    }
  }, [reset, isConfirmed, utils.user.getBalanceAndAllowance, needsApproval]);
}
