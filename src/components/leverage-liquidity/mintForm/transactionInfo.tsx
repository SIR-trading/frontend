import TransactionModal from "@/components/shared/transactionModal";
import { TransactionEstimates } from "./transactionEstimates";
import { TransactionStatus } from "./transactionStatus";
import { CircleCheck } from "lucide-react";
import { formatUnits } from "viem";
import { motion } from "motion/react";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
interface Props {
  isConfirmed: boolean;
  decimals: number;
  isApproving: boolean;
  isConfirming: boolean;
  userBalanceFetching: boolean;
  isPending: boolean;
  needsApproval: boolean;
  needs0Approval: boolean;
  tokenReceived: bigint | undefined;
  isApe: boolean;
  useNativeToken: boolean;
  quoteData: bigint | undefined;
  vaultId: string;
  transactionHash: string | undefined;
}

export default function TransactionInfo({
  isApe,
  quoteData,
  isConfirming,
  isConfirmed,
  isPending,
  isApproving,
  needsApproval,
  needs0Approval,
  tokenReceived,
  decimals,
  useNativeToken,
  userBalanceFetching,
  vaultId,
  transactionHash,
}: Props) {
  if (!isConfirmed) {
    return (
      <>
        <TransactionStatus
          showLoading={isConfirming || userBalanceFetching}
          waitForSign={isPending}
          action={
            !needsApproval
              ? "Mint"
              : needs0Approval
                ? "Remove Approval"
                : "Approve"
          }
        />
        {!needsApproval && (
          <TransactionEstimates
            isApe={isApe}
            decimals={decimals}
            usingEth={useNativeToken}
            collateralEstimate={quoteData}
            vaultId={vaultId}
          />
        )}
        {!needsApproval && (
          <TransactionModal.Disclaimer>
            Output is estimated.
          </TransactionModal.Disclaimer>
        )}
        {needsApproval && !needs0Approval && (
          <TransactionModal.Disclaimer>
            Approve Funds to Mint.
          </TransactionModal.Disclaimer>
        )}
        {needsApproval && needs0Approval && (
          <TransactionModal.Disclaimer>
            USDT requires users to remove approval before approving again!
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="animate-fade-in space-y-2  duration-500"
      >
        <div className="flex animate-fade-in justify-center">
          <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
        </div>
        <h2 className="text-gray-300 text-center">Transaction Successful!</h2>
        {Boolean(tokenReceived) && (
          <h3 className="flex items-center justify-center gap-x-1 ">
            <span className="text-xl font-medium ">
              <DisplayFormattedNumber num={formatUnits(tokenReceived ?? 0n, decimals)} significant={4} />{" "}
              {isApe ? "APE" : "TEA"}
              <span className="text-gray-400">{"-"}</span>
              {vaultId}{" "}
            </span>
          </h3>
        )}
        <ExplorerLink transactionHash={transactionHash} />
      </motion.div>
    );
  }
}
