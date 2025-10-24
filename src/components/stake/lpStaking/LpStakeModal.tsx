"use client";

import React, { useCallback, useMemo, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContracts,
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
import {
  getCurrentActiveIncentives,
  type IncentiveKey,
} from "@/data/uniswapIncentives";
import { encodeAbiParameters, encodeFunctionData } from "viem";

interface LpPosition {
  tokenId: bigint;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  isInRange: boolean;
  valueUsd: number;
  isStaked: boolean; // Whether position is in the staker contract
  missingIncentives: IncentiveKey[]; // Which incentives this position needs to be subscribed to
}

interface LpStakeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  positions: LpPosition[];
  onSuccess?: () => void;
}

export function LpStakeModal({
  open,
  setOpen,
  positions,
  onSuccess,
}: LpStakeModalProps) {
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

  // Get all active incentive keys
  const activeIncentives = useMemo(() => {
    const incentives = getCurrentActiveIncentives();

    return incentives;
  }, []);

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

  // Check which positions need approval
  const { data: approvalData, refetch: refetchApprovals } = useReadContracts({
    contracts: activePositions.map((position) => ({
      address: NonfungiblePositionManagerContract.address,
      abi: NonfungiblePositionManagerContract.abi,
      functionName: "getApproved" as const,
      args: [position.tokenId],
    })),
    query: {
      enabled: activePositions.length > 0 && !!address,
    },
  });

  // Determine which positions need approval
  const positionsNeedingApproval = useMemo(() => {
    if (!approvalData) return activePositions.map(() => true);

    return approvalData.map((result) => {
      if (result.status === "failure" || !result.result) return true;
      return result.result !== UniswapV3StakerContract.address;
    });
  }, [approvalData, activePositions]);

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

  // Handle multicall staking
  const handleMulticallStake = useCallback(() => {
    if (
      !address ||
      activeIncentives.length === 0 ||
      activePositions.length === 0
    ) {
      console.log("Early return - missing data");
      return;
    }

    // Separate positions into two categories
    const unstakedPositions = activePositions.filter((p) => !p.isStaked);
    const alreadyStakedPositions = activePositions.filter((p) => p.isStaked);

    // Build the multicall array
    const calls: `0x${string}`[] = [];

    // For truly unstaked positions: approve + transfer to staker (which stakes in ALL incentives at once!)
    unstakedPositions.forEach((position, _index) => {
      // Find the original index in the full activePositions array for approval checking
      const originalIndex = activePositions.findIndex(
        (p) => p.tokenId === position.tokenId,
      );

      // Add approval if needed
      if (originalIndex >= 0 && positionsNeedingApproval[originalIndex]) {
        calls.push(
          encodeFunctionData({
            abi: NonfungiblePositionManagerContract.abi,
            functionName: "approve",
            args: [UniswapV3StakerContract.address, position.tokenId],
          }),
        );
      }

      // Encode ALL active incentives as an array
      // The UniswapV3Staker's onERC721Received supports both single and array of incentives!
      if (activeIncentives.length > 0) {
        const encodedIncentives = encodeAbiParameters(
          [
            {
              type: "tuple[]",
              components: [
                { name: "rewardToken", type: "address" },
                { name: "pool", type: "address" },
                { name: "startTime", type: "uint256" },
                { name: "endTime", type: "uint256" },
                { name: "refundee", type: "address" },
              ],
            },
          ],
          [
            activeIncentives.map((incentive) => ({
              rewardToken: incentive.rewardToken,
              pool: incentive.pool,
              startTime: incentive.startTime,
              endTime: incentive.endTime,
              refundee: incentive.refundee,
            })),
          ],
        );

        calls.push(
          encodeFunctionData({
            abi: NonfungiblePositionManagerContract.abi,
            functionName: "safeTransferFrom",
            args: [
              address,
              UniswapV3StakerContract.address,
              position.tokenId,
              encodedIncentives,
            ],
          }),
        );
      }
    });

    // For already-staked positions: just call stakeToken for each missing incentive
    alreadyStakedPositions.forEach((position) => {
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

    // Determine which contract to execute the multicall on
    // If we have any unstaked positions, use NonfungiblePositionManager
    // Otherwise use UniswapV3Staker
    const contractToUse =
      unstakedPositions.length > 0
        ? NonfungiblePositionManagerContract
        : UniswapV3StakerContract;

    // Execute multicall
    executeMulticall({
      address: contractToUse.address,
      abi: contractToUse.abi,
      functionName: "multicall",
      args: [calls],
    });
  }, [
    executeMulticall,
    address,
    activePositions,
    activeIncentives,
    positionsNeedingApproval,
  ]);

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
          void refetchApprovals();
        }
      }
    },
    [setOpen, reset, writeError, refetchApprovals],
  );

  if (activeIncentives.length === 0) {
    return (
      <TransactionModal.Root
        title="Stake LP Positions"
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

  const inRangeCount = activePositions.filter((p) => p.isInRange).length;

  return (
    <TransactionModal.Root
      title={`Stake ${activePositions.length} LP Position${activePositions.length > 1 ? "s" : ""}`}
      open={open}
      setOpen={handleClose}
    >
      <TransactionModal.Close setOpen={handleClose} />
      <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
        {!isConfirmed ? (
          <>
            <TransactionStatus
              action="Stake Positions"
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Staking Summary */}
              <div className="rounded-md bg-muted/30 p-4">
                <h3 className="mb-3 text-sm font-medium">Staking Summary</h3>
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
                {activePositions.some((p) => !p.isStaked)
                  ? // Has unstaked positions
                    activeIncentives.length > 1
                    ? activePositions.length === 1
                      ? `This will approve (if needed), transfer (if needed), and stake your LP position in all ${activeIncentives.length} active incentives in a single transaction.`
                      : `All ${activePositions.length} positions will be approved (if needed), transferred (if needed), and staked in all ${activeIncentives.length} active incentives in a single transaction.`
                    : activePositions.length === 1
                      ? "This will approve (if needed), transfer (if needed), and stake your LP position in a single transaction."
                      : `All ${activePositions.length} positions will be approved (if needed), transferred (if needed), and staked in a single transaction.`
                  : // Only partially-staked positions
                    activePositions.length === 1
                    ? `This will subscribe your position to ${activePositions[0]?.missingIncentives.length ?? 0} missing incentive${(activePositions[0]?.missingIncentives.length ?? 0) > 1 ? "s" : ""}.`
                    : `This will subscribe all positions to their missing incentives.`}
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
                ? "Position Staked Successfully!"
                : `${activePositions.length} Positions Staked Successfully!`}
            </h2>
            <div className="text-center text-muted-foreground">
              {activePositions.length === 1
                ? `LP Position #${activePositions[0]?.tokenId.toString()} is now earning SIR rewards.`
                : `All ${activePositions.length} positions are now earning SIR rewards.`}
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
                activeIncentives.length === 0 ||
                activePositions.length === 0
              }
              isPending={isPending}
              loading={isConfirming}
              onClick={() => {
                handleMulticallStake();
              }}
              isConfirmed={isConfirmed}
            >
              {activePositions.length === 1
                ? "Stake Position"
                : `Stake ${activePositions.length} Positions`}
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
