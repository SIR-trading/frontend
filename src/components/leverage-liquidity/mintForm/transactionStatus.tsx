import Spinner from "@/components/shared/spinner";
// import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";

interface StatusProps {
  waitForSign: boolean;
  showLoading: boolean;
  action?: string;
  isConfirmed?: boolean;
}
export function TransactionStatus({
  action,
  showLoading,
  waitForSign,
  isConfirmed,
}: StatusProps) {
  const data = useMemo(() => {
    if (waitForSign) {
      return {
        message: (
          <div className="flex items-center justify-center gap-x-2">
            <Spinner />
            <span className="text-[14px]">Please sign transaction.</span>
          </div>
        ),
      };
    }
    if (showLoading) {
      return { message: <Spinner></Spinner> };
    }
    // For Create Vault, show "Create Vault" as the title
    return { message: action === "Create" ? "Create Vault" : action ?? "Mint" };
  }, [waitForSign, showLoading, action]);
  if (isConfirmed) {
    return undefined;
  }
  return <h2 className="text-center font-geist text-2xl">{data.message}</h2>;
}
