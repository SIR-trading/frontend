"use client";

import React, { useCallback, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { formatUnits } from "viem";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { SirContract } from "@/contracts/sir";
import { getSirSymbol } from "@/lib/assets";
import { env } from "@/env";

interface LpClaimRewardsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LpClaimRewardsModal({
  open,
  setOpen,
  onSuccess,
}: LpClaimRewardsModalProps) {
  const { address } = useAccount();
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const sirSymbol = getSirSymbol(chainId);

  // Read pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: UniswapV3StakerContract.address,
    abi: UniswapV3StakerContract.abi,
    functionName: "rewards",
    args: address ? [SirContract.address, address] : undefined,
  });

  // Contract write for claiming
  const {
    writeContract: claimRewards,
    data: hash,
    isPending,
    reset,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  // Handle claiming rewards
  const handleClaim = useCallback(() => {
    if (!address || !pendingRewards || pendingRewards === 0n) return;

    void claimRewards({
      address: UniswapV3StakerContract.address,
      abi: UniswapV3StakerContract.abi,
      functionName: "claimReward",
      args: [SirContract.address, address, pendingRewards],
    });
  }, [claimRewards, address, pendingRewards]);

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
      void refetchRewards(); // Refetch to update the rewards display
    }
  }, [isConfirmed, onSuccess, refetchRewards]);

  // Handle modal close
  const handleClose = useCallback((open: boolean) => {
    setOpen(open);
    if (!open && writeError) {
      reset();
    }
  }, [setOpen, reset, writeError]);

  const formattedRewards = pendingRewards
    ? formatUnits(pendingRewards, 12) // SIR has 12 decimals
    : "0";

  const hasRewards = pendingRewards && pendingRewards > 0n;

  return (
    <TransactionModal.Root
      title="Claim LP Rewards"
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
              action="Claim"
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Rewards Amount */}
              <div>
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Available Rewards
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold">
                    <DisplayFormattedNumber
                      num={formattedRewards}
                      significant={6}
                    />
                  </span>
                  <span className="text-xl text-muted-foreground">
                    {sirSymbol}
                  </span>
                </div>
              </div>

              {/* Reward Details */}
              {hasRewards && (
                <div>
                  <div className="mb-2">
                    <label className="text-sm text-muted-foreground">
                      Reward Details
                    </label>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>• Earned from providing liquidity</div>
                    <div>• Rewards accumulate while positions are in range</div>
                    <div>• Claim anytime, no time limit</div>
                  </div>
                </div>
              )}

              {/* No rewards message */}
              {!hasRewards && (
                <div className="text-center text-muted-foreground">
                  No rewards available to claim at this time.
                  Keep your positions staked and in range to earn rewards.
                </div>
              )}
            </div>

            {hasRewards && (
              <div className="px-6 py-4">
                <TransactionModal.Disclaimer>
                  Claim your earned {sirSymbol} rewards from LP staking.
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
              Rewards Claimed Successfully!
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-semibold">
                <DisplayFormattedNumber
                  num={formattedRewards}
                  significant={6}
                />
              </span>
              <span className="text-xl text-muted-foreground">
                {sirSymbol}
              </span>
            </div>
            <div className="text-center text-muted-foreground">
              Your {sirSymbol} rewards have been sent to your wallet.
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
              disabled={isPending || isConfirming || !hasRewards}
              isPending={isPending}
              loading={isConfirming}
              onClick={handleClaim}
              isConfirmed={isConfirmed}
            >
              {hasRewards ? "Confirm Claim" : "No Rewards"}
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