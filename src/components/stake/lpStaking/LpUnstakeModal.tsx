"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { getCurrentActiveIncentives } from "@/data/uniswapIncentives";
import { encodeFunctionData } from "viem";

interface LpUnstakeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  positionId: bigint;
  liquidity: bigint;
  onSuccess?: () => void;
}

export function LpUnstakeModal({
  open,
  setOpen,
  positionId,
  liquidity,
  onSuccess,
}: LpUnstakeModalProps) {
  const { address } = useAccount();

  // Get the active incentive key
  const incentiveKey = useMemo(() => {
    const activeIncentives = getCurrentActiveIncentives();
    return activeIncentives[0]; // Use the first active incentive
  }, []);

  // Use multicall to unstake and withdraw in one transaction
  const {
    writeContract: executeMulticall,
    data: hash,
    isPending,
    reset,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  // Handle unstaking
  const handleUnstake = useCallback(async () => {
    if (!address || !incentiveKey) return;

    // Prepare multicall data for unstaking and withdrawing
    const unstakeData = encodeFunctionData({
      abi: UniswapV3StakerContract.abi,
      functionName: "unstakeToken",
      args: [incentiveKey, positionId],
    });

    const withdrawData = encodeFunctionData({
      abi: UniswapV3StakerContract.abi,
      functionName: "withdrawToken",
      args: [positionId, address, "0x"],
    });

    executeMulticall({
      address: UniswapV3StakerContract.address,
      abi: UniswapV3StakerContract.abi,
      functionName: "multicall",
      args: [[unstakeData, withdrawData]],
    });
  }, [executeMulticall, address, positionId, incentiveKey]);

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  // Handle modal close
  const handleClose = useCallback((open: boolean) => {
    setOpen(open);
    if (!open && writeError) {
      reset();
    }
  }, [setOpen, reset, writeError]);

  if (!incentiveKey) {
    return (
      <TransactionModal.Root
        title="Unstake LP Position"
        open={open}
        setOpen={handleClose}
      >
        <TransactionModal.Close setOpen={handleClose} />
        <TransactionModal.InfoContainer isConfirming={false} hash={undefined}>
          <div className="text-center text-muted-foreground">
            No active incentive found for this position.
          </div>
        </TransactionModal.InfoContainer>
      </TransactionModal.Root>
    );
  }

  return (
    <TransactionModal.Root
      title="Unstake LP Position"
      open={open}
      setOpen={handleClose}
    >
      <TransactionModal.Close setOpen={handleClose} />
      <TransactionModal.InfoContainer
        isConfirming={isConfirming}
        hash={hash}
      >
        {!isConfirmed ? (
          <>
            <TransactionStatus
              action="Unstake"
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Position Details */}
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Unstaking LP Position
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">#{positionId.toString()}</span>
                  <span className="text-sm text-muted-foreground">
                    Position NFT
                  </span>
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

              {/* What happens next */}
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    After Unstaking
                  </label>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• Position NFT will be returned to your wallet</div>
                  <div>• You&apos;ll stop earning SIR rewards</div>
                  <div>• You can re-stake anytime</div>
                  <div>• Remember to claim any pending rewards</div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <TransactionModal.Disclaimer>
                This will unstake your position and return the NFT to your wallet.
              </TransactionModal.Disclaimer>
            </div>
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
              Position Unstaked Successfully!
            </h2>
            <div className="text-center text-muted-foreground">
              LP Position #{positionId.toString()} has been returned to your wallet.
            </div>
            <ExplorerLink transactionHash={hash} />
          </motion.div>
        )}
      </TransactionModal.InfoContainer>

      {!isConfirmed && (
        <>
          <div className="mx-4 border-t border-foreground/10" />
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              disabled={isPending || isConfirming || !incentiveKey}
              isPending={isPending}
              loading={isConfirming}
              onClick={handleUnstake}
              isConfirmed={isConfirmed}
            >
              Confirm Unstake
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </>
      )}

      {isConfirmed && (
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