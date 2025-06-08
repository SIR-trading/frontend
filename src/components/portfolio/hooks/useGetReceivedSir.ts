import { SirContract } from "@/contracts/sir";
import { useEffect, useState } from "react";
import { decodeEventLog, type Log } from "viem";
interface Props {
  logs: Log<bigint, number, false>[] | undefined;
  staking: boolean;
}

/**
 * Get tokens received from transaction logs.
 */
export function useGetReceivedSir({ logs, staking }: Props) {
  const [tokenReceived, setTokenReceived] = useState<bigint | undefined>();
  useEffect(() => {
    if (logs) {
      const foundLogs = logs.filter(
        (l) => l.address.toLowerCase() === SirContract.address.toLowerCase(),
      );
      if (!foundLogs) return;
      foundLogs.forEach((log) => {
        const parsed = decodeEventLog({
          abi: SirContract.abi,
          data: log.data,
          topics: log.topics,
        });
        if (staking) {
          if (parsed.eventName === "Transfer") {
            setTokenReceived(parsed.args.amount);
            return;
          }
        }
      });
    }
  }, [logs, staking]);
  return { tokenReceived };
}
