import { Dialog, DialogContent } from "@/components/ui/dialog";
import TransactionModal from "../transactionModal";
import StakeForm from "./stakeForm/stakeForm";

interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function StakeModal({ open, setOpen }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="Mint Modal" className="bg-transparent">
        <div
          className={`relative rounded-xl bg-secondary-800 text-white  transition-all duration-700`}
        >
          <TransactionModal.Close setOpen={setOpen} />
          <h1 className="pt-4 text-center font-geist text-2xl">Stake</h1>
          <StakeForm closeStakeModal={() => setOpen(false)}></StakeForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
