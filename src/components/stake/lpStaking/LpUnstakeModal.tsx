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

interface LpPosition {
  tokenId: bigint;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  isInRange: boolean;
  valueUsd: number;
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

  // Get ALL active incentives (we need to unstake from all of them)
  const activeIncentives = useMemo(() => {
    return getCurrentActiveIncentives();
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
    if (!address || activeIncentives.length === 0 || activePositions.length === 0) return;

    console.log('=== handleUnstake CALLED ===');
    console.log('activePositions:', activePositions);
    console.log('activeIncentives:', activeIncentives);

    // Build multicall array for all positions
    const calls: `0x${string}`[] = [];

    // For each position, unstake from ALL active incentives, then withdraw
    activePositions.forEach((position) => {
      console.log(`Processing position #${position.tokenId}`);

      // Unstake from ALL active incentives
      activeIncentives.forEach((incentive, idx) => {
        console.log(`  - Unstaking from incentive ${idx + 1}`);
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
  }, [executeMulticall, address, activePositions, activeIncentives]);

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

  if (activeIncentives.length === 0) {
    return (
      <TransactionModal.Root
        title="Unstake LP Positions"
        open={open}
        setOpen={handleClose}
      >
        <TransactionModal.Close setOpen={handleClose} />
        <TransactionModal.InfoContainer isConfirming={false} hash={undefined}>
          <div className="text-center text-muted-foreground">
            No active incentives found. Cannot unstake at this time.
          </div>
        </TransactionModal.InfoContainer>
      </TransactionModal.Root>
    );
  }

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
                {activeIncentives.length > 1 ? (
                  activePositions.length === 1
                    ? `This will unstake your position from all ${activeIncentives.length} active incentives and return the NFT to your wallet.`
                    : `All ${activePositions.length} positions will be unstaked from all ${activeIncentives.length} active incentives and the NFTs returned to your wallet in a single transaction.`
                ) : (
                  activePositions.length === 1
                    ? "This will unstake your position and return the NFT to your wallet."
                    : `All ${activePositions.length} positions will be unstaked and the NFTs returned to your wallet in a single transaction.`
                )}
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
              disabled={isPending || isConfirming || activeIncentives.length === 0 || activePositions.length === 0}
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
    </TransactionModal.Root>
  );
}