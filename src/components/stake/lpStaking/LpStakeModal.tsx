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
import { encodeAbiParameters, encodeFunctionData, keccak256 } from "viem";

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

// Helper function to compute incentive ID the same way the contract does
function computeIncentiveId(incentive: IncentiveKey): `0x${string}` {
  const encoded = encodeAbiParameters(
    [{
      type: 'tuple',
      components: [
        { name: 'rewardToken', type: 'address' },
        { name: 'pool', type: 'address' },
        { name: 'startTime', type: 'uint256' },
        { name: 'endTime', type: 'uint256' },
        { name: 'refundee', type: 'address' }
      ]
    }],
    [{
      rewardToken: incentive.rewardToken,
      pool: incentive.pool,
      startTime: incentive.startTime,
      endTime: incentive.endTime,
      refundee: incentive.refundee
    }]
  );
  return keccak256(encoded);
}

export function LpStakeModal({
  open,
  setOpen,
  positions,
  onSuccess,
}: LpStakeModalProps) {
  const { address } = useAccount();

  // Get all active incentive keys
  const activeIncentives = useMemo(() => {
    const incentives = getCurrentActiveIncentives();
    const now = BigInt(Math.floor(Date.now() / 1000));

    console.log('=== Active Incentives Debug ===');
    console.log('Current timestamp:', now.toString());
    incentives.forEach((incentive, idx) => {
      const incentiveId = computeIncentiveId(incentive);
      console.log(`Incentive ${idx + 1}:`, {
        incentiveId,
        rewardToken: incentive.rewardToken,
        pool: incentive.pool,
        startTime: incentive.startTime.toString(),
        endTime: incentive.endTime.toString(),
        refundee: incentive.refundee,
        isActive: incentive.startTime <= now && incentive.endTime >= now,
        startsIn: incentive.startTime > now ? `${(incentive.startTime - now).toString()} seconds` : 'Already started',
        endsIn: incentive.endTime > now ? `${(incentive.endTime - now).toString()} seconds` : 'Already ended',
      });
    });

    return incentives;
  }, []);

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

  // Debug logging when modal opens - MUST be after hooks that declare isPending/isConfirming
  useEffect(() => {
    if (open) {
      console.log('=== LpStakeModal opened ===');
      console.log('positions received:', positions);
      console.log('positions.length:', positions.length);
      console.log('activeIncentives:', activeIncentives);
      console.log('address:', address);
      console.log('isPending:', isPending);
      console.log('isConfirming:', isConfirming);
      console.log('Button will be disabled?', isPending || isConfirming || activeIncentives.length === 0 || positions.length === 0);
    }
  }, [open, positions, activeIncentives, address, isPending, isConfirming]);

  // Log write errors
  useEffect(() => {
    if (writeError) {
      console.error('=== WRITE ERROR ===');
      console.error(writeError);
    }
  }, [writeError]);

  // Handle multicall staking
  const handleMulticallStake = useCallback(() => {
    console.log('=== handleMulticallStake CALLED ===');
    console.log('address:', address);
    console.log('activeIncentives.length:', activeIncentives.length);
    console.log('positions.length:', positions.length);

    if (!address || activeIncentives.length === 0 || positions.length === 0) {
      console.log('Early return - missing data');
      return;
    }

    // Separate positions into two categories
    const unstakedPositions = positions.filter(p => !p.isStaked);
    const alreadyStakedPositions = positions.filter(p => p.isStaked);

    console.log('unstakedPositions:', unstakedPositions);
    console.log('alreadyStakedPositions:', alreadyStakedPositions);
    console.log('positionsNeedingApproval:', positionsNeedingApproval);

    // Log detailed position info
    positions.forEach(p => {
      console.log(`Position #${p.tokenId}:`, {
        isStaked: p.isStaked,
        missingIncentives: p.missingIncentives,
        missingIncentivesCount: p.missingIncentives.length
      });
    });

    // Build the multicall array
    const calls: `0x${string}`[] = [];

    // For truly unstaked positions: approve + transfer to staker (which stakes in ALL incentives at once!)
    unstakedPositions.forEach((position, _index) => {
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

      // Encode ALL active incentives as an array
      // The UniswapV3Staker's onERC721Received supports both single and array of incentives!
      if (activeIncentives.length > 0) {
        const encodedIncentives = encodeAbiParameters(
          [{
            type: 'tuple[]',
            components: [
              { name: 'rewardToken', type: 'address' },
              { name: 'pool', type: 'address' },
              { name: 'startTime', type: 'uint256' },
              { name: 'endTime', type: 'uint256' },
              { name: 'refundee', type: 'address' }
            ]
          }],
          [activeIncentives.map(incentive => ({
            rewardToken: incentive.rewardToken,
            pool: incentive.pool,
            startTime: incentive.startTime,
            endTime: incentive.endTime,
            refundee: incentive.refundee
          }))]
        );

        calls.push(
          encodeFunctionData({
            abi: NonfungiblePositionManagerContract.abi,
            functionName: "safeTransferFrom",
            args: [address, UniswapV3StakerContract.address, position.tokenId, encodedIncentives],
          })
        );

        console.log(`Position #${position.tokenId} will be staked in ALL ${activeIncentives.length} active incentives in one transaction!`);
      }
    });

    // For already-staked positions: just call stakeToken for each missing incentive
    alreadyStakedPositions.forEach((position) => {
      console.log(`Processing staked position #${position.tokenId}, missing ${position.missingIncentives.length} incentives`);
      position.missingIncentives.forEach((incentive, index) => {
        const incentiveId = computeIncentiveId(incentive);
        console.log(`  - Adding stakeToken for incentive ${index + 1}:`, {
          incentiveId,
          startTime: incentive.startTime.toString(),
          endTime: incentive.endTime.toString()
        });
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

    console.log('Total calls built:', calls.length);
    console.log('Calls:', calls);
    console.log('Contract to use:', contractToUse.address);
    console.log('About to call executeMulticall...');

    // Execute multicall
    executeMulticall({
      address: contractToUse.address,
      abi: contractToUse.abi,
      functionName: "multicall",
      args: [calls],
    });

    console.log('executeMulticall called!');
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
                {positions.some(p => !p.isStaked) ? (
                  // Has unstaked positions
                  activeIncentives.length > 1 ? (
                    positions.length === 1
                      ? `This will approve (if needed), transfer (if needed), and stake your LP position in all ${activeIncentives.length} active incentives in a single transaction.`
                      : `All ${positions.length} positions will be approved (if needed), transferred (if needed), and staked in all ${activeIncentives.length} active incentives in a single transaction.`
                  ) : (
                    positions.length === 1
                      ? "This will approve (if needed), transfer (if needed), and stake your LP position in a single transaction."
                      : `All ${positions.length} positions will be approved (if needed), transferred (if needed), and staked in a single transaction.`
                  )
                ) : (
                  // Only partially-staked positions
                  positions.length === 1
                    ? `This will subscribe your position to ${positions[0]?.missingIncentives.length ?? 0} missing incentive${(positions[0]?.missingIncentives.length ?? 0) > 1 ? 's' : ''}.`
                    : `This will subscribe all positions to their missing incentives.`
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
              onClick={() => {
                console.log('>>> Button clicked! <<<');
                console.log('activeIncentives.length:', activeIncentives.length);
                handleMulticallStake();
              }}
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