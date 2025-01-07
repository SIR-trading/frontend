import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

interface Props {
  // setOpen: (b: boolean) => void;
  children: React.ReactNode;
}
export function BurnFormModal({ children }: Props) {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent
        title="Mint Modal"
        align="center"
        animate="none"
        closeColor={"black"}
        className="bg-transparent"
      >
        <div
          className={`relative rounded-xl bg-secondary-800 p-6 text-white  transition-all duration-700`}
        >
          {/* <TransactionModal.Close setOpen={setOpen} /> */}
          {children}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
