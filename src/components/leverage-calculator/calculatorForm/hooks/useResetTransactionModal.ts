import { useEffect, useState } from "react";

export function useResetTransactionModal({
  reset,
  isConfirmed,
}: {
  reset: () => void;
  isConfirmed: boolean;
}) {
  const [openTransactionModal, setOpenTransactionModal] = useState(false);
  useEffect(() => {
    if (isConfirmed && !openTransactionModal) {
      setTimeout(() => {
        // wait for modal to close
        reset();
      }, 300);
    }
  }, [isConfirmed, reset, openTransactionModal]);
  return { openTransactionModal, setOpenTransactionModal };
}
