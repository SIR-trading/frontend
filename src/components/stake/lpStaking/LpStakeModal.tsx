"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import {
  NonfungiblePositionManagerContract,
  UniswapV3StakerContract,
} from "@/contracts/uniswapV3Staker";
import { getCurrentActiveIncentives } from "@/data/uniswapIncentives";

interface LpStakeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  positionId: bigint;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  isInRange: boolean;
  onSuccess?: () => void;
}

export function LpStakeModal({
  open,
  setOpen,
  positionId,
  liquidity,
  tickLower: _tickLower,
  tickUpper: _tickUpper,
  isInRange,
  onSuccess,
}: LpStakeModalProps) {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState<"approve" | "transfer" | "stake">("approve");

  // Get the active incentive key
  const incentiveKey = useMemo(() => {
    const activeIncentives = getCurrentActiveIncentives();
    return activeIncentives[0]; // Use the first active incentive
  }, []);

  // Check if NFT is already approved to the staker
  const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
    address: NonfungiblePositionManagerContract.address,
    abi: NonfungiblePositionManagerContract.abi,
    functionName: "getApproved",
    args: [positionId],
  });

  const needsApproval = approvedAddress !== UniswapV3StakerContract.address;

  // Contract write hooks
  const {
    writeContract: approveNft,
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const {
    writeContract: transferNft,
    data: transferHashData,
    isPending: isTransferPending,
    reset: resetTransfer,
  } = useWriteContract();

  const {
    isLoading: isTransferConfirming,
    isSuccess: isTransferConfirmed,
  } = useWaitForTransactionReceipt({ hash: transferHashData });

  const {
    writeContract: stakeToken,
    data: stakeHash,
    isPending: isStakePending,
    reset: resetStake,
  } = useWriteContract();

  const {
    isLoading: isStakeConfirming,
    isSuccess: isStakeConfirmed,
  } = useWaitForTransactionReceipt({ hash: stakeHash });

  // Update current step based on confirmations
  useEffect(() => {
    if (isApproveConfirmed && !needsApproval) {
      setCurrentStep("transfer");
    }
    if (isTransferConfirmed) {
      setCurrentStep("stake");
    }
  }, [isApproveConfirmed, isTransferConfirmed, needsApproval]);

  // Handle approval
  const handleApprove = useCallback(() => {
    if (!incentiveKey) return;

    void approveNft({
      address: NonfungiblePositionManagerContract.address,
      abi: NonfungiblePositionManagerContract.abi,
      functionName: "approve",
      args: [UniswapV3StakerContract.address, positionId],
    });
  }, [approveNft, positionId, incentiveKey]);

  // Handle transfer to staker
  const handleTransfer = useCallback(() => {
    if (!address || !incentiveKey) return;

    void transferNft({
      address: NonfungiblePositionManagerContract.address,
      abi: NonfungiblePositionManagerContract.abi,
      functionName: "safeTransferFrom",
      args: [address, UniswapV3StakerContract.address, positionId],
    });
  }, [transferNft, address, positionId, incentiveKey]);

  // Handle staking
  const handleStake = useCallback(() => {
    if (!incentiveKey) return;

    void stakeToken({
      address: UniswapV3StakerContract.address,
      abi: UniswapV3StakerContract.abi,
      functionName: "stakeToken",
      args: [incentiveKey, positionId],
    });
  }, [stakeToken, positionId, incentiveKey]);

  // Handle the current action based on step
  const handleCurrentAction = useCallback(() => {
    if (needsApproval && currentStep === "approve") {
      handleApprove();
    } else if (currentStep === "transfer") {
      handleTransfer();
    } else if (currentStep === "stake") {
      handleStake();
    }
  }, [currentStep, needsApproval, handleApprove, handleTransfer, handleStake]);

  // Check if all steps are complete
  const isComplete = isStakeConfirmed;

  // Get current hash for explorer link
  const currentHash = useMemo(() => {
    if (currentStep === "approve") return approveHash;
    if (currentStep === "transfer") return transferHashData;
    if (currentStep === "stake") return stakeHash;
    return undefined;
  }, [currentStep, approveHash, transferHashData, stakeHash]);

  // Check if current step is confirming
  const isConfirming = useMemo(() => {
    if (currentStep === "approve") return isApproveConfirming;
    if (currentStep === "transfer") return isTransferConfirming;
    if (currentStep === "stake") return isStakeConfirming;
    return false;
  }, [currentStep, isApproveConfirming, isTransferConfirming, isStakeConfirming]);

  // Check if current step is pending
  const isPending = useMemo(() => {
    if (currentStep === "approve") return isApprovePending;
    if (currentStep === "transfer") return isTransferPending;
    if (currentStep === "stake") return isStakePending;
    return false;
  }, [currentStep, isApprovePending, isTransferPending, isStakePending]);

  // Get action name for current step
  const actionName = useMemo(() => {
    if (currentStep === "approve") return "Approve NFT";
    if (currentStep === "transfer") return "Transfer NFT";
    if (currentStep === "stake") return "Stake Position";
    return "";
  }, [currentStep]);

  // Handle success callback
  useEffect(() => {
    if (isComplete && onSuccess) {
      onSuccess();
    }
  }, [isComplete, onSuccess]);

  // Reset function
  const handleReset = useCallback(() => {
    resetApprove();
    resetTransfer();
    resetStake();
    setCurrentStep("approve");
    void refetchApproval();
  }, [resetApprove, resetTransfer, resetStake, refetchApproval]);

  // Handle modal close
  const handleClose = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      handleReset();
    }
  }, [setOpen, handleReset]);

  if (!incentiveKey) {
    return (
      <TransactionModal.Root
        title="Stake LP Position"
        open={open}
        setOpen={handleClose}
      >
        <TransactionModal.Close setOpen={handleClose} />
        <TransactionModal.InfoContainer isConfirming={false} hash={undefined}>
          <div className="text-center text-muted-foreground">
            No active incentives available for staking at this time.
          </div>
        </TransactionModal.InfoContainer>
      </TransactionModal.Root>
    );
  }

  return (
    <TransactionModal.Root
      title="Stake LP Position"
      open={open}
      setOpen={handleClose}
    >
      <TransactionModal.Close setOpen={handleClose} />
      <TransactionModal.InfoContainer
        isConfirming={isConfirming}
        hash={currentHash}
      >
        {!isComplete ? (
          <>
            <TransactionStatus
              action={actionName}
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Position Details */}
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    LP Position
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">#{positionId.toString()}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full ${
                        isInRange ? "animate-pulse" : ""
                      }`}
                      style={{
                        width: "14px",
                        height: "14px",
                        backgroundColor: isInRange ? "#22c55e" : "rgb(107, 114, 128)",
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isInRange ? "In Range" : "Out of Range"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Staking Steps */}
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Staking Process
                  </label>
                </div>
                <div className="space-y-2">
                  {/* Step 1: Approve */}
                  <div className="flex items-center justify-between text-sm">
                    <span>1. Approve NFT Transfer</span>
                    {!needsApproval || isApproveConfirmed ? (
                      <CircleCheck size={18} className="text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </div>

                  {/* Step 2: Transfer */}
                  <div className="flex items-center justify-between text-sm">
                    <span>2. Transfer to Staker</span>
                    {isTransferConfirmed ? (
                      <CircleCheck size={18} className="text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">
                        {currentStep === "transfer" ? "Processing..." : "Pending"}
                      </span>
                    )}
                  </div>

                  {/* Step 3: Stake */}
                  <div className="flex items-center justify-between text-sm">
                    <span>3. Stake in Incentive</span>
                    {isStakeConfirmed ? (
                      <CircleCheck size={18} className="text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">
                        {currentStep === "stake" ? "Processing..." : "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Liquidity Info */}
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Position Liquidity
                  </label>
                </div>
                <div className="text-xl">
                  <DisplayFormattedNumber
                    num={liquidity.toString()}
                    significant={6}
                  />
                </div>
              </div>
            </div>

            {/* Action-specific disclaimers */}
            {currentStep === "approve" && needsApproval && (
              <div className="px-6 py-4">
                <TransactionModal.Disclaimer>
                  Approve the Uniswap V3 Staker contract to manage your LP NFT.
                </TransactionModal.Disclaimer>
              </div>
            )}

            {currentStep === "transfer" && (
              <div className="px-6 py-4">
                <TransactionModal.Disclaimer>
                  Transfer your LP NFT to the staking contract for safekeeping.
                </TransactionModal.Disclaimer>
              </div>
            )}

            {currentStep === "stake" && (
              <div className="px-6 py-4">
                <TransactionModal.Disclaimer>
                  Stake your position to start earning SIR rewards.
                </TransactionModal.Disclaimer>
              </div>
            )}
          </>
        ) : (
          // Success state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
            </div>
            <h2 className="text-center text-xl font-semibold">
              Position Staked Successfully!
            </h2>
            <div className="text-center text-muted-foreground">
              LP Position #{positionId.toString()} is now earning SIR rewards.
            </div>
            <ExplorerLink transactionHash={stakeHash} />
          </motion.div>
        )}
      </TransactionModal.InfoContainer>

      {!isComplete && (
        <>
          <div className="mx-4 border-t border-foreground/10" />
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              disabled={isPending || isConfirming || !incentiveKey}
              isPending={isPending}
              loading={isConfirming}
              onClick={handleCurrentAction}
              isConfirmed={isComplete}
            >
              {currentStep === "approve" && needsApproval && "Approve"}
              {currentStep === "transfer" && "Transfer"}
              {currentStep === "stake" && "Stake"}
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </>
      )}

      {isComplete && (
        <>
          <div className="mx-4 border-t border-foreground/10" />
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              disabled={false}
              isPending={false}
              loading={false}
              onClick={() => handleClose(false)}
              isConfirmed={true}
            >
              Close
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </>
      )}
    </TransactionModal.Root>
  );
}