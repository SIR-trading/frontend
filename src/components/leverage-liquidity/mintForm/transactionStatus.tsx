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
          <div className="flex items-center gap-x-2">
            <Spinner />
            <span className="text-[14px]">Please Sign Transaction.</span>
          </div>
        ),
      };
    }
    if (showLoading) {
      return { message: <Spinner></Spinner> };
    }
    return { message: action ?? "Mint" };
  }, [waitForSign, showLoading, action]);
  if (isConfirmed) {
    return undefined;
  }
  return <h2 className="  text-left text-lg">{data.message}</h2>;
}
