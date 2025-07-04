import React from "react";

import TransactionModal from "../shared/transactionModal";
import { Dialog, DialogContent } from "../ui/dialog";
interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function ClaimModal({ open, setOpen }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title="Mint Modal"
        // align="center"
        // animate="none"
        // closeColor={"black"}
        className="bg-transparent "
      >
        <div
          className={`relative w-[500px] rounded-xl  border border-foreground/10 bg-secondary  transition-all duration-700`}
        >
          <TransactionModal.Close setOpen={setOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
