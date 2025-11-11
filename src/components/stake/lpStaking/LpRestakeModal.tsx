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
import type { IncentiveKey } from "@/data/uniswapIncentives";
import { encodeFunctionData } from "viem";

interface LpPosition {
  tokenId: bigint;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  isInRange: boolean;
  valueUsd: number;
  isStaked: boolean;
  missingIncentives: IncentiveKey[];
}

interface LpRestakeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  positions: LpPosition[];
  onSuccess?: () => void;
}

export function LpRestakeModal({
  open,
  setOpen,
  positions,
  onSuccess,
}: LpRestakeModalProps) {
  const { address } = useAccount();

  // Snapshot positions when modal opens to prevent UI from updating when parent refetches
  const [positionsSnapshot, setPositionsSnapshot] = React.useState<
    LpPosition[]
  >([]);

  useEffect(() => {
    if (open && positions.length > 0) {
      // Store snapshot when modal opens
      setPositionsSnapshot(positions);
    }
  }, [open, positions]);

  // Use snapshot for all calculations if available, otherwise use live positions
  const activePositions =
    positionsSnapshot.length > 0 ? positionsSnapshot : positions;

  // Calculate total missing incentives
  const totalMissingIncentives = useMemo(() => {
    return activePositions.reduce(
      (sum, p) => sum + p.missingIncentives.length,
      0,
    );
  }, [activePositions]);

  // Calculate total USD value from positions
  const totalValueUsd = useMemo(() => {
    return activePositions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [activePositions]);

  // Calculate in-range USD value
  const inRangeValueUsd = useMemo(() => {
    return activePositions
      .filter((p) => p.isInRange)
      .reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [activePositions]);

  // Contract write for multicall
  const {
    writeContract: executeMulticall,
    data: hash,
    isPending,
    reset,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  // Handle multicall restaking
  const handleMulticallRestake = useCallback(() => {
    if (!address || activePositions.length === 0) {
      console.log("Early return - missing data");
      return;
    }

    // Build the multicall array - call stakeToken for each missing incentive on each position
    const calls: `0x${string}`[] = [];

    activePositions.forEach((position) => {
      position.missingIncentives.forEach((incentive) => {
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
      });
    });

    // Execute multicall on UniswapV3Staker
    executeMulticall({
      address: UniswapV3StakerContract.address,
      abi: UniswapV3StakerContract.abi,
      functionName: "multicall",
      args: [calls],
    });
  }, [executeMulticall, address, activePositions]);

  // Handle success callback
  useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  // Handle modal close
  const handleClose = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (!open) {
        // Reset snapshot when modal closes
        setPositionsSnapshot([]);
        if (writeError) {
          reset();
        }
      }
    },
    [setOpen, reset, writeError],
  );

  if (totalMissingIncentives === 0) {
    return (
      <TransactionModal.Root
        title="Restake LP Positions"
        open={open}
        setOpen={handleClose}
      >
        <TransactionModal.Close setOpen={handleClose} />
        <TransactionModal.InfoContainer isConfirming={false} hash={undefined}>
          <div className="text-center text-muted-foreground">
            No positions need restaking. All positions are subscribed to all
            active incentives.
          </div>
        </TransactionModal.InfoContainer>
      </TransactionModal.Root>
    );
  }

  const inRangeCount = activePositions.filter((p) => p.isInRange).length;

  return (
    <TransactionModal.Root
      title={`Restake ${activePositions.length} LP Position${activePositions.length > 1 ? "s" : ""}`}
      open={open}
      setOpen={handleClose}
    >
      <TransactionModal.Close setOpen={handleClose} />
      <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
        {!isConfirmed ? (
          <>
            <TransactionStatus
              action="Restake Positions"
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Restaking Summary */}
              <div className="rounded-md bg-muted/30 p-4">
                <h3 className="mb-3 text-sm font-medium">Restaking Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Positions
                    </span>
                    <span className="text-sm font-semibold">
                      {activePositions.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Missing Incentives
                    </span>
                    <span className="text-sm font-semibold text-orange-500">
                      {totalMissingIncentives}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      In Range
                    </span>
                    <span className="text-green-500 text-sm font-semibold">
                      {inRangeCount} / {activePositions.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Value Breakdown */}
              <div className="rounded-md bg-muted/30 p-4">
                <h3 className="mb-3 text-sm font-medium">Position Value</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Value
                    </span>
                    <span className="text-lg font-semibold">
                      {totalValueUsd > 0 ? (
                        <>
                          <DisplayFormattedNumber
                            num={totalValueUsd}
                            significant={3}
                          />{" "}
                          USD
                        </>
                      ) : (
                        <span className="text-sm">Calculating...</span>
                      )}
                    </span>
                  </div>
                  {inRangeCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        In-Range Value
                      </span>
                      <span className="text-green-500 text-sm font-medium">
                        {inRangeValueUsd > 0 ? (
                          <DisplayFormattedNumber
                            num={inRangeValueUsd}
                            significant={3}
                          />
                        ) : (
                          "0"
                        )}{" "}
                        USD
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <TransactionModal.Disclaimer>
                {activePositions.length === 1
                  ? `This will subscribe your position to ${activePositions[0]?.missingIncentives.length ?? 0} missing incentive${(activePositions[0]?.missingIncentives.length ?? 0) > 1 ? "s" : ""} so it can earn the maximum rewards.`
                  : `This will subscribe all ${activePositions.length} positions to their missing incentives (${totalMissingIncentives} total) so they can earn the maximum rewards.`}
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
                ? "Position Restaked Successfully!"
                : `${activePositions.length} Positions Restaked Successfully!`}
            </h2>
            <div className="text-center text-muted-foreground">
              {activePositions.length === 1
                ? `LP Position #${activePositions[0]?.tokenId.toString()} is now earning from all active incentives.`
                : `All ${activePositions.length} positions are now earning from all active incentives.`}
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
              disabled={
                isPending ||
                isConfirming ||
                totalMissingIncentives === 0 ||
                activePositions.length === 0
              }
              isPending={isPending}
              loading={isConfirming}
              onClick={() => {
                handleMulticallRestake();
              }}
              isConfirmed={isConfirmed}
            >
              {activePositions.length === 1
                ? "Restake Position"
                : `Restake ${activePositions.length} Positions`}
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
