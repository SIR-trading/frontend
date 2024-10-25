import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import TransactionModal from "../transactionModal";
import StakeForm from "./stakeForm/stakeForm";

interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function StakeModal({ open, setOpen }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        title="Mint Modal"
        align="center"
        animate="none"
        closeColor={"black"}
        className="bg-transparent"
      >
        <div
          className={`relative rounded-xl bg-secondary-600 text-white  transition-all duration-700`}
        >
          <TransactionModal.Close setOpen={setOpen} />
          <h1 className="pt-4 text-center font-lora text-2xl">Stake</h1>
          <StakeForm></StakeForm>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
