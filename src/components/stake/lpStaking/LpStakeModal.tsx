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
import { getCurrentActiveIncentives, type IncentiveKey } from "@/data/uniswapIncentives";
import { encodeAbiParameters, parseAbiParameters, encodeFunctionData } from "viem";

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

  // Get all active incentive keys
  const activeIncentives = useMemo(() => getCurrentActiveIncentives(), []);

  // Calculate total USD value from positions
  const totalValueUsd = useMemo(() => {
    return positions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [positions]);

  // Calculate in-range USD value
  const inRangeValueUsd = useMemo(() => {
    return positions.filter(p => p.isInRange).reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [positions]);

  // Check which positions need approval
  const { data: approvalData, refetch: refetchApprovals } = useReadContracts({
    contracts: positions.map((position) => ({
      address: NonfungiblePositionManagerContract.address,
      abi: NonfungiblePositionManagerContract.abi,
      functionName: "getApproved" as const,
      args: [position.tokenId],
    })),
    query: {
      enabled: positions.length > 0 && !!address,
    },
  });

  // Determine which positions need approval
  const positionsNeedingApproval = useMemo(() => {
    if (!approvalData) return positions.map(() => true);

    return approvalData.map((result) => {
      if (result.status === 'failure' || !result.result) return true;
      return (result.result) !== UniswapV3StakerContract.address;
    });
  }, [approvalData, positions]);

  // Contract write for multicall
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

  // Handle multicall staking
  const handleMulticallStake = useCallback(() => {
    if (!address || activeIncentives.length === 0 || positions.length === 0) return;

    // Separate positions into two categories
    const unstakedPositions = positions.filter(p => !p.isStaked);
    const alreadyStakedPositions = positions.filter(p => p.isStaked);

    // Build the multicall array
    const calls: `0x${string}`[] = [];

    // For truly unstaked positions: approve + transfer to staker (which auto-stakes in ALL incentives)
    unstakedPositions.forEach((position, index) => {
      // Find the original index in the full positions array for approval checking
      const originalIndex = positions.findIndex(p => p.tokenId === position.tokenId);

      // Add approval if needed
      if (originalIndex >= 0 && positionsNeedingApproval[originalIndex]) {
        calls.push(
          encodeFunctionData({
            abi: NonfungiblePositionManagerContract.abi,
            functionName: "approve",
            args: [UniswapV3StakerContract.address, position.tokenId],
          })
        );
      }

      // For each active incentive, encode and transfer
      // We'll use the first incentive for the transfer data (staker will handle all)
      if (activeIncentives.length > 0 && activeIncentives[0]) {
        const encodedIncentive = encodeAbiParameters(
          parseAbiParameters('address rewardToken, address pool, uint256 startTime, uint256 endTime, address refundee'),
          [
            activeIncentives[0].rewardToken,
            activeIncentives[0].pool,
            activeIncentives[0].startTime,
            activeIncentives[0].endTime,
            activeIncentives[0].refundee,
          ]
        );

        calls.push(
          encodeFunctionData({
            abi: NonfungiblePositionManagerContract.abi,
            functionName: "safeTransferFrom",
            args: [address, UniswapV3StakerContract.address, position.tokenId, encodedIncentive],
          })
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
          })
        );
      });
    });

    // Determine which contract to execute the multicall on
    // If we have any unstaked positions, use NonfungiblePositionManager
    // Otherwise use UniswapV3Staker
    const contractToUse = unstakedPositions.length > 0
      ? NonfungiblePositionManagerContract
      : UniswapV3StakerContract;

    // Execute multicall
    executeMulticall({
      address: contractToUse.address,
      abi: contractToUse.abi,
      functionName: "multicall",
      args: [calls],
    });
  }, [executeMulticall, address, positions, activeIncentives, positionsNeedingApproval]);

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
      void refetchApprovals();
    }
  }, [setOpen, reset, writeError, refetchApprovals]);

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

  const inRangeCount = positions.filter(p => p.isInRange).length;

  return (
    <TransactionModal.Root
      title={`Stake ${positions.length} LP Position${positions.length > 1 ? 's' : ''}`}
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
              action="Stake Positions"
              waitForSign={isPending}
              showLoading={isConfirming}
            />

            <div className="space-y-4">
              {/* Staking Summary */}
              <div className="rounded-md bg-muted/30 p-4">
                <h3 className="text-sm font-medium mb-3">Staking Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Positions</span>
                    <span className="text-sm font-semibold">{positions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">In Range</span>
                    <span className="text-sm font-semibold text-green-500">
                      {inRangeCount} / {positions.length}
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
                          $<DisplayFormattedNumber
                            num={totalValueUsd}
                            significant={3}
                          />
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
                        ${inRangeValueUsd > 0 ? (
                          <DisplayFormattedNumber
                            num={inRangeValueUsd}
                            significant={3}
                          />
                        ) : '0'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <TransactionModal.Disclaimer>
                {positions.length === 1
                  ? "This will approve (if needed), transfer, and stake your LP position in a single transaction."
                  : `All ${positions.length} positions will be approved (if needed), transferred, and staked in a single transaction.`
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
              {positions.length === 1
                ? "Position Staked Successfully!"
                : `${positions.length} Positions Staked Successfully!`
              }
            </h2>
            <div className="text-center text-muted-foreground">
              {positions.length === 1
                ? `LP Position #${positions[0]?.tokenId.toString()} is now earning SIR rewards.`
                : `All ${positions.length} positions are now earning SIR rewards.`
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
              disabled={isPending || isConfirming || activeIncentives.length === 0 || positions.length === 0}
              isPending={isPending}
              loading={isConfirming}
              onClick={handleMulticallStake}
              isConfirmed={isConfirmed}
            >
              {positions.length === 1
                ? "Stake Position"
                : `Stake ${positions.length} Positions`
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