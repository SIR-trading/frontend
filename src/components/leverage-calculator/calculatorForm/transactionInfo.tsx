import TransactionModal from "@/components/shared/transactionModal";
import { TransactionEstimates } from "./transactionEstimates";
import { TransactionStatus } from "./transactionStatus";
import { CircleCheck } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { formatUnits } from "viem";

interface Props {
  isConfirmed: boolean;
  decimals: number;
  isApproving: boolean;
  isConfirming: boolean;
  userBalanceFetching: boolean;
  isPending: boolean;
  needsApproval: boolean;
  tokenReceived: bigint | undefined;
  isApe: boolean;
  useEth: boolean;
  quoteData: bigint | undefined;
  vaultId: string;
}

export default function TransactionInfo({
  isApe,
  quoteData,
  isConfirming,
  isConfirmed,
  isPending,
  isApproving,
  needsApproval,
  tokenReceived,
  decimals,
  useEth,
  userBalanceFetching,
  vaultId,
}: Props) {
  if (!isConfirmed) {
    return (
      <>
        <TransactionStatus
          showLoading={isConfirming || userBalanceFetching}
          waitForSign={isPending}
          action={!needsApproval ? "Mint" : "Approve"}
        />
        {!needsApproval && (
          <TransactionEstimates
            isApe={isApe}
            decimals={decimals}
            usingEth={useEth}
            collateralEstimate={quoteData}
            vaultId={vaultId}
          />
        )}
        {!needsApproval && (
          <TransactionModal.Disclaimer>
            Output is estimated.
          </TransactionModal.Disclaimer>
        )}
        {needsApproval && (
          <TransactionModal.Disclaimer>
            Approve SIR to send token funds .....
          </TransactionModal.Disclaimer>
        )}
      </>
    );
  }
  if (isConfirming && isApproving) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }
  if (isConfirmed && !isApproving) {
    return (
      <div className="space-y-2">
        <div className="flex animate-fade-in justify-center">
          <CircleCheck size={40} color="#F0C775" />
        </div>
        <h2 className="text-center text-gray-300">Transaction Successful!</h2>
        {Boolean(tokenReceived) && (
          <h3 className="flex items-center justify-center gap-x-1 ">
            <span className="text-xl font-medium ">
              {formatNumber(formatUnits(tokenReceived ?? 0n, decimals), 4)}{" "}
              {isApe ? "APE" : "TEA"}
              <span className="text-gray-400">{"-"}</span>
              {vaultId}{" "}
            </span>
          </h3>
        )}
      </div>
    );
  }
}
