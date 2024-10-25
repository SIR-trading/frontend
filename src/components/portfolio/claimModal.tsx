import React from "react";
import { AlertDialog, AlertDialogContent } from "../ui/alert-dialog";

import TransactionModal from "../shared/transactionModal";
interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function ClaimModal({ open, setOpen }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        title="Mint Modal"
        align="center"
        animate="none"
        closeColor={"black"}
        className="bg-transparent "
      >
        <div
          className={`relative w-[500px] rounded-xl  bg-secondary-700 text-white  transition-all duration-700`}
        >
          <TransactionModal.Close setOpen={setOpen} />
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
