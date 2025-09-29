import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  reset: () => void;
  children: React.ReactNode;
}
export function BurnFormModal({ reset, children }: Props) {
  return (
    <Dialog open={true} onOpenChange={() => reset()}>
      <DialogContent title="Close Position" className="bg-transparent">
        <div
          className={`relative rounded-xl border border-foreground/10 bg-secondary  px-4 py-2 transition-all duration-700`}
        >
          {/* <TransactionModal.Close setOpen={setOpen} /> */}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
