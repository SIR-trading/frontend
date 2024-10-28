import { ApeContract } from "@/contracts/ape";
import { VaultContract } from "@/contracts/vault";
import type { TAddressString } from "@/lib/types";
import { useEffect, useState } from "react";
import { decodeEventLog, type Log } from "viem";
interface Props {
  logs: Log<bigint, number, false>[] | undefined;
  apeAddress: TAddressString;
  isApe: boolean;
}

/**
 * Get tokens received from transaction logs.
 */
export function useGetReceivedTokens({ logs, apeAddress, isApe }: Props) {
  const [tokenReceived, setTokenReceived] = useState<bigint | undefined>();
  useEffect(() => {
    if (logs) {
      if (isApe) {
        const foundLogs = logs.filter(
          (l) => l.address.toLowerCase() === apeAddress.toLowerCase(),
        );
        if (!foundLogs) return;
        foundLogs.forEach((log) => {
          const parsed = decodeEventLog({
            abi: ApeContract.abi,
            data: log.data,
            topics: log.topics,
          });

          if (parsed.eventName === "Transfer") {
            setTokenReceived(parsed.args.amount);
            return;
          }
        });
      } else {
        const foundLogs = logs.filter(
          (l) =>
            l.address.toLowerCase() === VaultContract.address.toLowerCase(),
        );
        if (!foundLogs) return;
        foundLogs.forEach((log) => {
          const parse = decodeEventLog({
            abi: VaultContract.abi,
            data: log.data,
            topics: log.topics,
          });
          console.log(parse);
          if (parse.eventName === "TransferSingle") {
            console.log(parse.args);
            setTokenReceived(parse.args.amount);
            return;
          }
        });
      }
    }
  }, [apeAddress, isApe, logs]);
  return { tokenReceived };
}
