"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import { formatUnits, encodeFunctionData } from "viem";
import Image from "next/image";
import TransactionModal from "@/components/shared/transactionModal";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { UniswapV3StakerContract } from "@/contracts/uniswapV3Staker";
import { SirContract } from "@/contracts/sir";
import { getSirSymbol, getSirLogo } from "@/lib/assets";
import { env } from "@/env";
import { useSirPrice } from "@/contexts/SirPriceContext";
import { getAllChainIncentives, getCurrentActiveIncentives } from "@/data/uniswapIncentives";

interface LpClaimRewardsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
  liveRewards: bigint; // Live rewards including fresh accruals from getRewardInfo
  stakedPositions: Array<{ tokenId: bigint }>; // Staked positions for unstaking before claim
}

export function LpClaimRewardsModal({
  open,
  setOpen,
  onSuccess,
  liveRewards,
  stakedPositions,
}: LpClaimRewardsModalProps) {
  const { address } = useAccount();
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const sirSymbol = getSirSymbol(chainId);
  const sirLogo = getSirLogo(chainId);
  const { sirPrice } = useSirPrice();

  // Read base rewards (already recorded on-chain)
  const { data: baseRewards, refetch: refetchRewards } = useReadContract({
    address: UniswapV3StakerContract.address,
    abi: UniswapV3StakerContract.abi,
    functionName: "rewards",
    args: address ? [SirContract.address, address] : undefined,
    chainId: chainId,
  });

  // Get all incentives for unstaking (to capture all fresh accruals)
  const allIncentives = useMemo(() => getAllChainIncentives(), []);

  // Get active incentives for restaking
  const activeIncentives = useMemo(() => getCurrentActiveIncentives(), []);

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
    if (!address || liveRewards === 0n) return;

    if (stakedPositions.length > 0) {
      // Smart multicall: unstake → claim all → restake to active
      const calls: `0x${string}`[] = [];

      // Step 1: Unstake from ALL incentives (to move fresh accruals to rewards mapping)
      for (const position of stakedPositions) {
        for (const incentive of allIncentives) {
          calls.push(
            encodeFunctionData({
              abi: UniswapV3StakerContract.abi,
              functionName: "unstakeToken",
              args: [
                {
                  rewardToken: incentive.rewardToken,
                  pool: incentive.pool,
                  startTime: incentive.startTime,
                  endTime: incentive.endTime,
                  refundee: incentive.refundee,
                },
                position.tokenId,
              ],
            }),
          );
        }
      }

      // Step 2: Claim all rewards (amountRequested=0 means claim everything)
      calls.push(
        encodeFunctionData({
          abi: UniswapV3StakerContract.abi,
          functionName: "claimReward",
          args: [SirContract.address, address, 0n], // 0 = claim all
        }),
      );

      // Step 3: Restake to ACTIVE incentives only
      for (const position of stakedPositions) {
        for (const incentive of activeIncentives) {
          calls.push(
            encodeFunctionData({
              abi: UniswapV3StakerContract.abi,
              functionName: "stakeToken",
              args: [
                {
                  rewardToken: incentive.rewardToken,
                  pool: incentive.pool,
                  startTime: incentive.startTime,
                  endTime: incentive.endTime,
                  refundee: incentive.refundee,
                },
                position.tokenId,
              ],
            }),
          );
        }
      }

      // Execute the multicall
      void claimRewards({
        address: UniswapV3StakerContract.address,
        abi: UniswapV3StakerContract.abi,
        functionName: "multicall",
        args: [calls],
      });
    } else {
      // No staked positions, just claim directly
      void claimRewards({
        address: UniswapV3StakerContract.address,
        abi: UniswapV3StakerContract.abi,
        functionName: "claimReward",
        args: [SirContract.address, address, 0n], // 0 = claim all
      });
    }
  }, [claimRewards, address, liveRewards, stakedPositions, allIncentives, activeIncentives]);

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

  const formattedRewards = liveRewards > 0n
    ? formatUnits(liveRewards, 12) // SIR has 12 decimals
    : "0";

  const hasRewards = liveRewards > 0n;

  // Calculate USD value
  const usdValue = sirPrice && liveRewards > 0n
    ? (Number(formatUnits(liveRewards, 12)) * sirPrice)
    : 0;

  return (
    <TransactionModal.Root
      title="Claim SIR Rewards"
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
            <h2 className="mb-4 text-center text-xl font-semibold">
              Claim {sirSymbol} Rewards
            </h2>

            {hasRewards ? (
              <div className="pt-2">
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Amount
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    <DisplayFormattedNumber
                      num={formattedRewards}
                      significant={3}
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">
                      {sirSymbol}
                    </span>
                    <Image
                      src={sirLogo}
                      alt={sirSymbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </div>
                </div>
                {usdValue > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    ≈ $<DisplayFormattedNumber num={usdValue} significant={3} />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No rewards available to claim at this time.
                Keep your positions staked and in range to earn rewards.
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
                  significant={3}
                />
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl text-muted-foreground">
                  {sirSymbol}
                </span>
                <Image
                  src={sirLogo}
                  alt={sirSymbol}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              </div>
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
              Claim
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