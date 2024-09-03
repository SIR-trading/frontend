import React from "react";
import { useClaim } from "../stake/hooks/useClaim";
import { AlertDialog, AlertDialogContent } from "../ui/alert-dialog";
import ClaimFees from "../stake/claimFees/claimFees";
import { api } from "@/trpc/react";
import { formatEther, type SimulateContractReturnType } from "viem";
import { useAccount } from "wagmi";

interface Props {
  open: boolean;
  setOpen: (b: boolean) => void;
}
export function ClaimModal({ open, setOpen }: Props) {
  type SimulateReq = SimulateContractReturnType["request"] | undefined;
  const { Claim, isFetching: claimFetching } = useClaim();
  const { isConnected, address } = useAccount();
  const { data: ethBalance } = api.user.getEthBalance.useQuery(
    {
      userAddress: address,
    },
    {
      enabled: isConnected,
    },
  );

  const { data: dividends } = api.user.getDividends.useQuery(
    {
      staker: address,
    },
    { enabled: isConnected },
  );
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
          className={`rounded-xl relative transition-all duration-700  bg-secondary text-white`}
        >
          <ClaimFees
            ethBalance={formatEther(ethBalance ?? 0n)}
            claimAmount={formatEther(dividends ?? 0n)}
            claimSimulate={Claim?.request as SimulateReq}
            claimResult={Claim?.result}
            claimFetching={claimFetching}
          ></ClaimFees>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}