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

  // Get the active incentive key
  const incentiveKey = useMemo(() => {
    const activeIncentives = getCurrentActiveIncentives();
    return activeIncentives[0]; // Use the first active incentive
  }, []);

  // Calculate total USD value from positions
  const totalValueUsd = useMemo(() => {
    return positions.reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [positions]);

  // Calculate in-range USD value
  const inRangeValueUsd = useMemo(() => {
    return positions.filter(p => p.isInRange).reduce((sum, p) => sum + (p.valueUsd || 0), 0);
  }, [positions]);

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
    if (!address || !incentiveKey || positions.length === 0) return;

    // Build multicall array for all positions
    const calls: `0x${string}`[] = [];

    // Add unstake and withdraw calls for each position
    positions.forEach((position) => {
      // Unstake from incentive
      calls.push(
        encodeFunctionData({
          abi: UniswapV3StakerContract.abi,
          functionName: "unstakeToken",
          args: [incentiveKey, position.tokenId],
        })
      );
      // Withdraw NFT back to wallet
      calls.push(
        encodeFunctionData({
          abi: UniswapV3StakerContract.abi,
          functionName: "withdrawToken",
          args: [position.tokenId, address, "0x"],
        })
      );
    });

    executeMulticall({
      address: UniswapV3StakerContract.address,
      abi: UniswapV3StakerContract.abi,
      functionName: "multicall",
      args: [calls],
    });
  }, [executeMulticall, address, positions, incentiveKey]);

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
        title="Unstake LP Positions"
        open={open}
        setOpen={handleClose}
      >
        <TransactionModal.Close setOpen={handleClose} />
        <TransactionModal.InfoContainer isConfirming={false} hash={undefined}>
          <div className="text-center text-muted-foreground">
            No active incentive found for these positions.
          </div>
        </TransactionModal.InfoContainer>
      </TransactionModal.Root>
    );
  }

  const inRangeCount = positions.filter(p => p.isInRange).length;

  return (
    <TransactionModal.Root
      title={`Unstake ${positions.length} LP Position${positions.length > 1 ? 's' : ''}`}
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
                  ? "This will unstake your position and return the NFT to your wallet."
                  : `All ${positions.length} positions will be unstaked and the NFTs returned to your wallet in a single transaction.`
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
                ? "Position Unstaked Successfully!"
                : `${positions.length} Positions Unstaked Successfully!`
              }
            </h2>
            <div className="text-center text-muted-foreground">
              {positions.length === 1
                ? `LP Position #${positions[0]?.tokenId.toString()} has been returned to your wallet.`
                : `All ${positions.length} LP positions have been returned to your wallet.`
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
              disabled={isPending || isConfirming || !incentiveKey || positions.length === 0}
              isPending={isPending}
              loading={isConfirming}
              onClick={handleUnstake}
              isConfirmed={isConfirmed}
            >
              {positions.length === 1
                ? "Unstake Position"
                : `Unstake ${positions.length} Positions`
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