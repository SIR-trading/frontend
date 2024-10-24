import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import ToolTip from "@/components/ui/tooltip";
import { X } from "lucide-react";
import type { ReactNode } from "react";
interface Props {
  setOpen: (b: boolean) => void;
  open: boolean;
  children: React.ReactNode;
}
function Root({ open, setOpen, children }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent
        onTop={true}
        title="Mint Modal"
        align="center"
        animate="none"
        closeColor={"black"}
        className="z-[400] bg-transparent"
      >
        <div
          className={`relative rounded-xl bg-secondary-800 text-white  transition-all duration-700`}
        >
          {children}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
const StatContainer = ({ children }: { children: ReactNode }) => (
  <div className="flex w-full flex-col gap-y-1 py-2">{children}</div>
);
function StatSubmitContainer({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-center gap-y-4 rounded-md px-6  py-4">
      {children}
    </div>
  );
}

function InfoContainer({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-tl-xl rounded-tr-xl bg-secondary-600 px-6 pb-6 pt-5">
      {children}
    </div>
  );
}

function Disclaimer({ children }: { children: ReactNode }) {
  return (
    <div className="w-[300px] items-center pt-2 text-[12px] italic text-gray-400">
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
    <div className="relative  flex justify-between text-[13px]">
      <h3 className="text-gray-300 ">
        <span className="z-20 flex items-center gap-x-1">
          {title} {info && <ToolTip>{info}</ToolTip>}
        </span>
      </h3>
      <h4>{value}</h4>
    </div>
  );
}

function SubmitButton({
  onClick,
  disabled,
  children,
  loading,
  isConfirmed,
}: {
  onClick: () => void;
  disabled: boolean;
  children: ReactNode;
  loading: boolean;
  isConfirmed: boolean;
}) {
  return (
    <Button
      className="text-[16px]"
      onClick={onClick}
      disabled={disabled}
      variant="modal"
      state={loading ? "loading" : "default"}
      type="submit"
    >
      <Pending isConfirmed={isConfirmed} isLoading={loading}>
        {children}
      </Pending>
    </Button>
  );
}
function Pending({
  children,
  isLoading,
  isConfirmed,
}: {
  children: ReactNode;
  isLoading: boolean;
  isConfirmed: boolean;
}) {
  if (isLoading) {
    return "Pending...";
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
