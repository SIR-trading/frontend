import { VaultContract } from "@/contracts/vault";
import { useEffect, useState } from "react";
import { decodeEventLog, type Log } from "viem";
interface Props {
  logs: Log<bigint, number, false>[] | undefined;
}

/**
 * Get tokens received from transaction logs.
 * Todo Rename
 */
export function useGetTxTokens({ logs }: Props) {
  const [tokenReceived, setTokenReceived] = useState<bigint | undefined>();
  useEffect(() => {
    if (logs) {
      const foundLogs = logs.filter(
        (l) => l.address === VaultContract.address.toLowerCase(),
      );
      if (!foundLogs) return;
      foundLogs.forEach((log) => {
        const parsed = decodeEventLog({
          abi: VaultContract.abi,
          data: log.data,
          topics: log.topics,
        });
        if (parsed.eventName === "Burn") {
          setTokenReceived(parsed.args.collateralWithdrawn);
          return;
        }
      });
    }
  }, [logs]);
  return { tokenReceived };
}
