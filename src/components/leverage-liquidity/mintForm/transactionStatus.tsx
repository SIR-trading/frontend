import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";

interface StatusProps {
  waitForSign: boolean;
  showLoading: boolean;
  action?: string;
}
export function TransactionStatus({
  action,
  showLoading,
  waitForSign,
}: StatusProps) {
  const data = useMemo(() => {
    if (waitForSign) {
      return { message: "Please Sign Transaction." };
    }
    if (showLoading) {
      return { message: <LoaderCircle className="animate-spin" /> };
    }
    return { message: action ?? "Mint" };
  }, [waitForSign, showLoading, action]);
  return <h2 className="text-left text-lg">{data.message}</h2>;
}
