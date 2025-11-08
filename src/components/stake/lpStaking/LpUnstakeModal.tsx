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
import { getAllChainIncentives, type IncentiveKey } from "@/data/uniswapIncentives";
import { encodeFunctionData } from "viem";
import type { LpPosition } from "./types";

// Generate a unique ID for an incentive key (for matching with stakesPerIncentive map)
function getIncentiveId(incentive: IncentiveKey): string {
  return `${incentive.rewardToken}-${incentive.pool}-${incentive.startTime}-${incentive.endTime}`;
}

interface LpUnstakeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  positions: LpPosition[];
  onSuccess?: () => void;
}

export function LpUnstakeModal({
  open,
  setOpen,
  positions,
  onSuccess,
}: LpUnstakeModalProps) {
  const { address } = useAccount();

  // Snapshot positions when modal opens to prevent UI from updating when parent refetches
  const [positionsSnapshot, setPositionsSnapshot] = React.useState<LpPosition[]>([]);

  useEffect(() => {
    if (open && positions.length > 0) {
      // Store snapshot when modal opens
      setPositionsSnapshot(positions);
    }
  }, [open, positions]);

  // Use snapshot for all calculations if available, otherwise use live positions
  const activePositions = positionsSnapshot.length > 0 ? positionsSnapshot : positions;

  // Get ALL incentives (active, past, and future) - positions might be staked in any of them
  const allIncentives = useMemo(() => {
    return getAllChainIncentives();
  }, []);

  // Calculate total USD value from positions
  const totalValueUsd = useMemo(() => {
    return activePositions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [activePositions]);

  // Calculate in-range USD value
  const inRangeValueUsd = useMemo(() => {
    return activePositions.filter(p => p.isInRange).reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [activePositions]);

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

  // Handle unstaking multiple positions
  const handleUnstake = useCallback(async () => {
    if (!address || activePositions.length === 0) return;

    console.log('=== handleUnstake CALLED ===');
    console.log('activePositions:', activePositions);
    console.log('allIncentives (checking all):', allIncentives);

    // Build multicall array for all positions
    const calls: `0x${string}`[] = [];

    // For each position, unstake from ALL incentives (past, present, future)
    // We check stakesPerIncentive to know which ones it's actually in
    activePositions.forEach((position) => {
      console.log(`Processing position #${position.tokenId}`);
      console.log(`  numberOfStakes: ${position.numberOfStakes}`);
      console.log(`  stakesPerIncentive:`, position.stakesPerIncentive);

      // Check ALL incentives (not just active ones) - position might be in past/future incentives
      allIncentives.forEach((incentive, idx) => {
        const incentiveId = getIncentiveId(incentive);
        const stakedLiquidity = position.stakesPerIncentive.get(incentiveId);

        // Only call unstakeToken if position is staked in this incentive (liquidity > 0)
        if (stakedLiquidity && stakedLiquidity > 0n) {
          console.log(`  - Unstaking from incentive ${idx + 1}: ${incentiveId.substring(0, 20)}... (liquidity: ${stakedLiquidity})`);
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
                position.tokenId
              ],
            })
          );
        } else {
          console.log(`  - Skipping incentive ${idx + 1} (not staked or liquidity = 0)`);
        }
      });

      // After unstaking from all incentives, withdraw the NFT back to wallet
      console.log(`  - Withdrawing NFT #${position.tokenId} to wallet`);
      calls.push(
        encodeFunctionData({
          abi: UniswapV3StakerContract.abi,
          functionName: "withdrawToken",
          args: [position.tokenId, address, "0x"],
        })
      );
    });

    console.log('Total calls built:', calls.length);
    console.log('About to execute multicall...');

    executeMulticall({
      address: UniswapV3StakerContract.address,
      abi: UniswapV3StakerContract.abi,
      functionName: "multicall",
      args: [calls],
    });

    console.log('executeMulticall called!');
  }, [executeMulticall, address, activePositions, allIncentives]);

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  // Handle modal close
  const handleClose = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      // Reset snapshot when modal closes
      setPositionsSnapshot([]);
      if (writeError) {
        reset();
      }
    }
  }, [setOpen, reset, writeError]);


  const inRangeCount = activePositions.filter(p => p.isInRange).length;

  return (
    <TransactionModal.Root
      title={`Unstake ${activePositions.length} LP Position${activePositions.length > 1 ? 's' : ''}`}
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
              action="Unstake Positions"
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Unstaking Summary */}
              <div className="rounded-md bg-muted/30 p-4">
                <h3 className="text-sm font-medium mb-3">Unstaking Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Positions</span>
                    <span className="text-sm font-semibold">{activePositions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">In Range</span>
                    <span className="text-sm font-semibold text-green-500">
                      {inRangeCount} / {activePositions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Value Breakdown */}
              <div className="rounded-md bg-muted/30 p-4">
                <h3 className="text-sm font-medium mb-3">Position Value</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="text-lg font-semibold">
                      {totalValueUsd > 0 ? (
                        <>
                          <DisplayFormattedNumber
                            num={totalValueUsd}
                            significant={3}
                          /> USD
                        </>
                      ) : (
                        <span className="text-sm">Calculating...</span>
                      )}
                    </span>
                  </div>
                  {inRangeCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">In-Range Value</span>
                      <span className="text-sm font-medium text-green-500">
                        {inRangeValueUsd > 0 ? (
                          <DisplayFormattedNumber
                            num={inRangeValueUsd}
                            significant={3}
                          />
                        ) : '0'} USD
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <TransactionModal.Disclaimer>
                {activePositions.length === 1
                  ? "This will unstake your position from any active incentives and return the NFT to your wallet."
                  : `All ${activePositions.length} positions will be unstaked from any active incentives and the NFTs returned to your wallet in a single transaction.`
                }
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
              {activePositions.length === 1
                ? "Position Unstaked Successfully!"
                : `${activePositions.length} Positions Unstaked Successfully!`
              }
            </h2>
            <div className="text-center text-muted-foreground">
              {activePositions.length === 1
                ? `LP Position #${activePositions[0]?.tokenId.toString()} has been returned to your wallet.`
                : `All ${activePositions.length} LP positions have been returned to your wallet.`
              }
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
              disabled={isPending || isConfirming || activePositions.length === 0}
              isPending={isPending}
              loading={isConfirming}
              onClick={() => {
                console.log('>>> Unstake button clicked! <<<');
                void handleUnstake();
              }}
              isConfirmed={isConfirmed}
            >
              {activePositions.length === 1
                ? "Unstake Position"
                : `Unstake ${activePositions.length} Positions`
              }
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

      {/* Show errors */}
      {writeError && !isConfirming && !isConfirmed && (() => {
        const errorMessage = writeError.message || "";
        const isUserRejection = errorMessage.toLowerCase().includes("user rejected") ||
                               errorMessage.toLowerCase().includes("user denied");

        if (!isUserRejection) {
          return (
            <div className="px-6 pb-4">
              <p className="text-xs text-center" style={{ color: "#ef4444" }}>
                Transaction failed: {errorMessage}
              </p>
            </div>
          );
        }
      })()}
    </TransactionModal.Root>
  );
}