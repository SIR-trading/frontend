import { Button } from "@/components/ui/button";
import ToolTip from "@/components/ui/tooltip";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import ExplorerLink from "./explorerLink";
interface Props {
  setOpen: (b: boolean) => void;
  open: boolean;
  title: string;
  children: React.ReactNode;
}
function Root({ open, title, setOpen, children }: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        title={title}
        // align="center"
        // animate="none"
        // closeColor={"black"}
        className="z-[400] bg-transparent"
      >
        <div
          className={`relative rounded-xl bg-secondary-800 text-white  transition-all duration-700`}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
const StatContainer = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full animate-fade-in flex-col gap-y-1 py-2 duration-500">
    {children}
  </div>
);
function StatSubmitContainer({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center gap-y-4 rounded-md px-6  py-4">
      {children}
    </div>
  );
}

function InfoContainer({
  children,
  hash,
  isConfirming,
}: {
  children: ReactNode;
  hash: string | undefined;
  isConfirming: boolean;
}) {
  return (
    <div className="space-y-2 rounded-tl-xl rounded-tr-xl bg-secondary-700 px-6 pb-6 pt-5">
      {children}
      {isConfirming && (
        <div className="">
          <ExplorerLink align="left" transactionHash={hash} />
        </div>
      )}
    </div>
  );
}

function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="w-[300px] items-center  text-[12px] italic text-gray-400">
      <span>{children}</span>
    </div>
  );
}
function Close({ setOpen }: { setOpen: (b: boolean) => void }) {
  return (
    <div className="absolute right-3 top-3">
      <X
        className="cursor-pointer"
        size={20}
        onClick={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}
function StatRow({
  title,
  value,
  info,
}: {
  title: string;
  info?: string;
  value: string;
}) {
  return (
    <div className="relative  flex h-[20px] justify-between text-[13px]">
      <h3 className="text-gray-300 ">
        <span className="z-20 flex items-center gap-x-1">
          {title} {info && <ToolTip>{info}</ToolTip>}
        </span>
      </h3>
      <h4>
        <DisplayFormattedNumber num={value} />
      </h4>
    </div>
  );
}

function SubmitButton({
  onClick,
  disabled,
  children,
  loading,
  isPending,
  isConfirmed,
}: {
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
  loading: boolean;
  isPending: boolean;
  isConfirmed: boolean;
}) {
  const isLoading = isPending || loading;
  return (
    <Button
      className="text-[16px]"
      onClick={onClick}
      disabled={disabled || isLoading}
      variant="modal"
      state={isLoading ? "loading" : "default"}
      type="submit"
    >
      <Pending
        isPending={isPending}
        isConfirmed={isConfirmed}
        isLoading={isLoading}
      >
        {children}
      </Pending>
    </Button>
  );
}
function Pending({
  children,
  isLoading,
  isConfirmed,
  isPending,
}: {
  children: ReactNode;
  isPending: boolean;
  isLoading: boolean;
  isConfirmed: boolean;
}) {
  if (isPending) {
    return "Signing Transaction";
  }
  if (isLoading) {
    return "Waiting for Confirmation";
  } else if (isConfirmed) {
    return "Close";
  } else {
    return <>{children}</>;
  }
}
const TransactionModal = {
  Root,
  InfoContainer,
  Close,
  StatRow,
  StatSubmitContainer,
  StatContainer,
  Disclaimer,
  SubmitButton,
};
export default TransactionModal;
