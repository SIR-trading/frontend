import TransactionModal from "@/components/shared/transactionModal";
import { TransactionEstimates } from "./transactionEstimates";
import { TransactionStatus } from "./transactionStatus";
import { CircleCheck } from "lucide-react";
import { formatUnits } from "viem";
import { motion } from "motion/react";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { TokenImage } from "@/components/shared/TokenImage";
import { useFormContext } from "react-hook-form";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { parseAddress } from "@/lib/utils/index";
import { useNativeCurrency } from "@/components/shared/hooks/useNativeCurrency";
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
  const form = useFormContext<TMintFormFields>();
  const nativeCurrency = useNativeCurrency();
  const data = form.watch();
  const deposit = form.getValues("deposit");

  const usingDebt =
    data.depositToken === parseAddress(data.versus) && data.depositToken !== "";
  const collateralAssetName = useNativeToken
    ? nativeCurrency.symbol
    : form.getValues("long").split(",")[1] ?? "";
  const debtAssetName = useNativeToken
    ? nativeCurrency.symbol
    : form.getValues("versus").split(",")[1] ?? "";
  const depositTokenSymbol = usingDebt ? debtAssetName : collateralAssetName;
  const depositTokenAddress = data.depositToken;

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

        {!needsApproval && !isConfirming && (
          <div className="space-y-4">
            {/* Depositing Amount */}
            <div>
              <div className="mb-2">
                <label className="text-sm text-muted-foreground">
                  Depositing Amount
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl">
                  <DisplayFormattedNumber
                    num={deposit}
                    significant={undefined}
                  />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-muted-foreground">
                    {depositTokenSymbol}
                  </span>
                  {depositTokenAddress && (
                    <TokenImage
                      address={depositTokenAddress}
                      alt={depositTokenSymbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Receiving Amount */}
            {quoteData && (
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Receiving Amount (Estimated)
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    <DisplayFormattedNumber
                      num={formatUnits(quoteData, decimals)}
                      significant={6}
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">
                      {isApe ? "APE" : "TEA"}-{vaultId}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {needsApproval && !needs0Approval && (
          <div className="px-6 py-4">
            <TransactionModal.Disclaimer>
              Approve Funds to Mint.
            </TransactionModal.Disclaimer>
          </div>
        )}
        {needsApproval && needs0Approval && (
          <div className="px-6 py-4">
            <TransactionModal.Disclaimer>
              USDT requires users to remove approval before approving again!
            </TransactionModal.Disclaimer>
          </div>
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
        className="space-y-2"
      >
        <div className="flex justify-center">
          <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
        </div>
        <h2 className="text-center">Transaction Successful!</h2>
        {Boolean(tokenReceived) && (
          <div className="flex items-center justify-center gap-x-2">
            <span className="text-xl">
              <DisplayFormattedNumber
                num={formatUnits(tokenReceived ?? 0n, decimals)}
                significant={6}
              />
            </span>
            <span className="text-xl text-muted-foreground">
              {isApe ? "APE" : "TEA"}-{vaultId}
            </span>
          </div>
        )}
        <ExplorerLink transactionHash={transactionHash} />
      </motion.div>
    );
  }
}
