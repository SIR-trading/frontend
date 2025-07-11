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
          className={` relative rounded-xl  border border-foreground/10 bg-secondary transition-all duration-700`}
        >
          <TransactionModal.Close setOpen={setOpen} />
          <h1 className="pt-4 text-center font-geist text-2xl">Unstake</h1>
          <UnstakeForm closeUnstakeModal={() => setOpen(false)}></UnstakeForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
