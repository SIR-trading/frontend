import TransactionModal from "@/components/shared/transactionModal";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  // setOpen: (b: boolean) => void;
  children: React.ReactNode;
}
export function BurnFormModal({ open, children }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        title="Mint Modal"
        align="center"
        animate="none"
        closeColor={"black"}
        className="bg-transparent"
      >
        <div
          className={`relative rounded-xl bg-secondary-800 p-4 text-white  transition-all duration-700`}
        >
          {/* <TransactionModal.Close setOpen={setOpen} /> */}
          {children}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
