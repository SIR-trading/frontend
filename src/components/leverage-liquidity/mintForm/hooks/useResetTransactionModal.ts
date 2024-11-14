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
      reset();
    }
  }, [isConfirmed, reset, openTransactionModal]);
  return { openTransactionModal, setOpenTransactionModal };
}
