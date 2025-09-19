import { Dialog, DialogContent } from "../ui/dialog";
import TransactionModal from "../shared/transactionModal";
import UnstakeForm from "./unstakeForm";
interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function UnstakeModal({ open, setOpen }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title="Mint Modal"
        // align="center"
        // animate="none"
        // closeColor={"black"}
        className="bg-transparent"
      >
        <div
          className={`relative rounded-xl border border-foreground/10 bg-secondary transition-all duration-700`}
        >
          <TransactionModal.Close setOpen={setOpen} />
          <div className="space-y-4 rounded-t-xl px-6 pb-2 pt-6">
            <h2 className="text-center text-xl font-semibold mb-4">Unstake</h2>
          </div>
          <UnstakeForm closeUnstakeModal={() => setOpen(false)}></UnstakeForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
