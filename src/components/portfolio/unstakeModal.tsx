import { formatUnits, type SimulateContractReturnType } from "viem";
import { useClaim } from "../stake/hooks/useClaim";
import UnstakeForm from "../stake/unstakeForm/unstakeForm";
import { AlertDialog, AlertDialogContent } from "../ui/alert-dialog";
import TransactionModal from "../shared/transactionModal";
import { useGetStakedSir } from "../shared/hooks/useGetStakedSir";
interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function UnstakeModal({ open, setOpen }: Props) {
  type SimulateReq = SimulateContractReturnType["request"] | undefined;
  const { claimData, isFetching: claimFetching } = useClaim();

  const stakedSir = useGetStakedSir();
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
          <h1 className="pt-4 text-center font-lora text-2xl">Unstake</h1>
          <UnstakeForm
            balance={stakedSir}
            claimSimulate={claimData?.request as SimulateReq}
            claimResult={claimData?.result}
            claimFetching={claimFetching}
          ></UnstakeForm>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
