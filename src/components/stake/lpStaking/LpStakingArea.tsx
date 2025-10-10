"use client";
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LpMetrics } from "./LpMetrics";
import { useUserLpPositions } from "./hooks/useUserLpPositions";
import { StakeCardWrapper } from "../stakeCardWrapper";
import { getSirSymbol } from "@/lib/assets";
import { LpStakeModal } from "./LpStakeModal";
import { LpUnstakeModal } from "./LpUnstakeModal";
import { LpClaimRewardsModal } from "./LpClaimRewardsModal";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { CheckCircle2, XCircle } from "lucide-react";
import HoverPopupMobile from "@/components/ui/hover-popup-mobile";
import ToolTip from "@/components/ui/tooltip";
import { useAccount } from "wagmi";

export function LpStakingArea() {
  const { isConnected } = useAccount();
  const {
    unstakedPositions,
    stakedPositions,
    globalStakingStats,
    userRewards,
    isLoading,
    refetchAll,
    stakingApr,
  } = useUserLpPositions();

  // Modal states
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  // Timeout refs for cleanup
  const stakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unstakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const claimTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (stakeTimeoutRef.current) clearTimeout(stakeTimeoutRef.current);
      if (unstakeTimeoutRef.current) clearTimeout(unstakeTimeoutRef.current);
      if (claimTimeoutRef.current) clearTimeout(claimTimeoutRef.current);
    };
  }, []);

  // Calculate totals for unstaked positions
  const unstakedTotals = useMemo(() => {
    const inRange = unstakedPositions
      .filter((p) => p.isInRange)
      .reduce((sum, p) => sum + p.valueUsd, 0);
    const outOfRange = unstakedPositions
      .filter((p) => !p.isInRange)
      .reduce((sum, p) => sum + p.valueUsd, 0);
    return { inRange, outOfRange };
  }, [unstakedPositions]);

  // Calculate totals for staked positions
  const stakedTotals = useMemo(() => {
    const inRange = stakedPositions
      .filter((p) => p.isInRange)
      .reduce((sum, p) => sum + p.valueUsd, 0);
    const outOfRange = stakedPositions
      .filter((p) => !p.isInRange)
      .reduce((sum, p) => sum + p.valueUsd, 0);
    return { inRange, outOfRange };
  }, [stakedPositions]);

  // Handle stake button click - stakes all unstaked positions
  const handleStakeClick = useCallback(() => {
    console.log("Stake button clicked");
    console.log("unstakedPositions:", unstakedPositions);
    console.log("unstakedPositions.length:", unstakedPositions.length);
    if (unstakedPositions.length > 0) {
      console.log("Opening modal");
      setStakeModalOpen(true);
    } else {
      console.log("No unstaked positions - button should be disabled");
    }
  }, [unstakedPositions]);

  // Handle unstake button click - unstakes all staked positions
  const handleUnstakeClick = useCallback(() => {
    if (stakedPositions.length > 0) {
      setUnstakeModalOpen(true);
    }
  }, [stakedPositions]);

  // Handle claim button click
  const handleClaimClick = useCallback(() => {
    setClaimModalOpen(true);
  }, []);

  return (
    <Card className="card-shadow rounded-[4px] bg-secondary p-4 md:px-6 md:py-6">
      <h2 className="pb-4 text-sm font-medium">Uniswap V3 LP Staking</h2>

      {/* Metrics at top */}
      <LpMetrics
        totalValueStakedUsd={globalStakingStats.totalValueStakedUsd}
        inRangeValueStakedUsd={globalStakingStats.inRangeValueStakedUsd}
        stakingApr={stakingApr}
        isLoading={isLoading}
      />

      {/* LP Position Cards - vertically stacked */}
      <div className="space-y-4">
        {/* LP Positions (Unstaked) */}
        <StakeCardWrapper>
          <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
            <div className="flex justify-between">
              <div>
                <h2 className="flex items-center gap-x-1 pb-1 text-sm text-muted-foreground">
                  <span>LP Balance</span>
                  <ToolTip iconSize={12}>
                    Includes both completely unstaked positions and positions
                    only earning from some of the active incentives.
                  </ToolTip>
                </h2>
                <div className="flex min-h-[32px] items-baseline justify-between text-3xl">
                  {!isConnected ? (
                    <div className="flex items-end gap-x-1">
                      <div className="text-sm italic text-foreground">
                        Connect to stake
                      </div>
                    </div>
                  ) : !isLoading ? (
                    <>
                      {unstakedPositions.length > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <HoverPopupMobile
                            trigger={
                              <div className="flex cursor-pointer items-baseline gap-1">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xl">
                                  {unstakedTotals.inRange > 0 ? (
                                    <DisplayFormattedNumber
                                      num={unstakedTotals.inRange}
                                      significant={3}
                                    />
                                  ) : (
                                    "0"
                                  )}
                                  <span className="text-muted-foreground"> USD</span>
                                </span>
                              </div>
                            }
                            size="200"
                          >
                            <span className="text-[13px] font-medium">
                              In range
                            </span>
                          </HoverPopupMobile>
                          <span className="text-2xl text-muted-foreground">
                            +
                          </span>
                          <HoverPopupMobile
                            trigger={
                              <div className="flex cursor-pointer items-baseline gap-1">
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xl">
                                  {unstakedTotals.outOfRange > 0 ? (
                                    <DisplayFormattedNumber
                                      num={unstakedTotals.outOfRange}
                                      significant={3}
                                    />
                                  ) : (
                                    "0"
                                  )}
                                  <span className="text-muted-foreground"> USD</span>
                                </span>
                              </div>
                            }
                            size="200"
                          >
                            <span className="text-[13px] font-medium">
                              Out of range
                            </span>
                          </HoverPopupMobile>
                          <HoverPopupMobile
                            trigger={
                              <span className="cursor-pointer text-sm text-muted-foreground hover:text-foreground ml-2">
                                ({unstakedPositions.length}{" "}
                                {unstakedPositions.length === 1
                                  ? "position"
                                  : "positions"}
                                )
                              </span>
                            }
                            size="250"
                          >
                            <div className="space-y-2">
                              {unstakedPositions.map((position) => (
                                <div
                                  key={position.tokenId.toString()}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-block rounded-full ${position.isInRange ? "animate-pulse" : ""}`}
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        backgroundColor: position.isInRange
                                          ? "#22c55e"
                                          : "rgb(107, 114, 128)",
                                        minWidth: "10px",
                                        minHeight: "10px",
                                      }}
                                    />
                                    <span className="text-xs">
                                      #{position.tokenId.toString()}
                                    </span>
                                  </div>
                                  <span className="whitespace-nowrap text-xs font-medium">
                                    {position.valueUsd > 0 ? (
                                      <DisplayFormattedNumber
                                        num={position.valueUsd}
                                        significant={3}
                                      />
                                    ) : (
                                      "0"
                                    )}{" "}
                                    USD
                                  </span>
                                </div>
                              ))}
                            </div>
                          </HoverPopupMobile>
                        </div>
                      ) : (
                        <span className="text-xl">
                          0 <span className="text-muted-foreground">USD</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="h-8 w-24 animate-pulse rounded bg-foreground/10"></div>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!unstakedPositions.length}
                  onClick={handleStakeClick}
                  type="button"
                  className="w-20 py-2"
                >
                  Stake
                </Button>
              </div>
            </div>
          </div>
        </StakeCardWrapper>

        {/* Staked LP Positions */}
        <StakeCardWrapper>
          <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
            <div className="flex justify-between">
              <div>
                <h2 className="flex items-center gap-x-1 pb-1 text-sm text-muted-foreground">
                  <span>Staked LP Balance</span>
                  <ToolTip iconSize={12}>
                    Positions staked in at least one reward program. Partially
                    staked positions are only earning from some of the active
                    incentives.
                  </ToolTip>
                </h2>
                <div className="flex min-h-[32px] items-baseline justify-between text-3xl">
                  {!isConnected ? (
                    <div className="flex items-end gap-x-1">
                      <div className="text-sm italic text-foreground">
                        Connect to unstake
                      </div>
                    </div>
                  ) : !isLoading ? (
                    <>
                      {stakedPositions.length > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <HoverPopupMobile
                            trigger={
                              <div className="flex cursor-pointer items-baseline gap-1">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xl">
                                  {stakedTotals.inRange > 0 ? (
                                    <DisplayFormattedNumber
                                      num={stakedTotals.inRange}
                                      significant={3}
                                    />
                                  ) : (
                                    "0"
                                  )}
                                  <span className="text-muted-foreground"> USD</span>
                                </span>
                              </div>
                            }
                            size="200"
                          >
                            <span className="text-[13px] font-medium">
                              In range
                            </span>
                          </HoverPopupMobile>
                          <span className="text-2xl text-muted-foreground">
                            +
                          </span>
                          <HoverPopupMobile
                            trigger={
                              <div className="flex cursor-pointer items-baseline gap-1">
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xl">
                                  {stakedTotals.outOfRange > 0 ? (
                                    <DisplayFormattedNumber
                                      num={stakedTotals.outOfRange}
                                      significant={3}
                                    />
                                  ) : (
                                    "0"
                                  )}
                                  <span className="text-muted-foreground"> USD</span>
                                </span>
                              </div>
                            }
                            size="200"
                          >
                            <span className="text-[13px] font-medium">
                              Out of range
                            </span>
                          </HoverPopupMobile>
                          <HoverPopupMobile
                            trigger={
                              <span className="cursor-pointer text-sm text-muted-foreground hover:text-foreground ml-2">
                                ({stakedPositions.length}{" "}
                                {stakedPositions.length === 1
                                  ? "position"
                                  : "positions"}
                                )
                              </span>
                            }
                            size="250"
                          >
                            <div className="space-y-2">
                              {stakedPositions.map((position) => (
                                <div
                                  key={position.tokenId.toString()}
                                  className="flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`inline-block rounded-full ${position.isInRange ? "animate-pulse" : ""}`}
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        backgroundColor: position.isInRange
                                          ? "#22c55e"
                                          : "rgb(107, 114, 128)",
                                        minWidth: "10px",
                                        minHeight: "10px",
                                      }}
                                    />
                                    <span className="text-xs">
                                      #{position.tokenId.toString()}
                                    </span>
                                  </div>
                                  <span className="whitespace-nowrap text-xs font-medium">
                                    {position.valueUsd > 0 ? (
                                      <DisplayFormattedNumber
                                        num={position.valueUsd}
                                        significant={3}
                                      />
                                    ) : (
                                      "0"
                                    )}{" "}
                                    USD
                                  </span>
                                </div>
                              ))}
                            </div>
                          </HoverPopupMobile>
                        </div>
                      ) : (
                        <span className="text-xl">
                          0 <span className="text-muted-foreground">USD</span>
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="h-8 w-24 animate-pulse rounded bg-foreground/10"></div>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!stakedPositions.length}
                  onClick={handleUnstakeClick}
                  type="button"
                  className="w-20 py-2"
                >
                  Unstake
                </Button>
              </div>
            </div>
          </div>
        </StakeCardWrapper>

        {/* SIR Token Rewards */}
        <StakeCardWrapper>
          <div
            className={`rounded-md bg-primary/5 p-4 dark:bg-primary ${userRewards >= 100000000000000000n ? "claim-card-gold-glow" : ""}`}
          >
            <div className="flex justify-between">
              <div>
                <h2 className="pb-1 text-sm text-muted-foreground">
                  SIR Token Rewards
                </h2>
                <div className="flex min-h-[32px] items-baseline justify-between text-3xl">
                  {!isConnected ? (
                    <div className="flex items-end gap-x-1">
                      <div className="text-sm italic text-foreground">
                        Connect to claim rewards
                      </div>
                    </div>
                  ) : !isLoading ? (
                    <div className="flex items-baseline gap-x-1">
                      <span className="text-xl">
                        {userRewards > 0n ? (
                          <DisplayFormattedNumber
                            num={Number(userRewards) / 1e12}
                            significant={3}
                          />
                        ) : (
                          "0"
                        )}
                        <span className="text-muted-foreground"> {getSirSymbol()}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="h-8 w-24 animate-pulse rounded bg-foreground/10"></div>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!(userRewards > 0n)}
                  onClick={handleClaimClick}
                  type="button"
                  className="w-20 py-2"
                >
                  Claim
                </Button>
              </div>
            </div>
          </div>
        </StakeCardWrapper>
      </div>

      {/* Modals */}
      <LpStakeModal
        open={stakeModalOpen}
        setOpen={setStakeModalOpen}
        positions={unstakedPositions}
        onSuccess={() => {
          // Wait for blockchain state to update, then refetch
          // Keep modal open so user can see success message and close it manually
          // Clear any existing timeout before setting new one
          if (stakeTimeoutRef.current) {
            clearTimeout(stakeTimeoutRef.current);
          }
          stakeTimeoutRef.current = setTimeout(() => {
            void refetchAll();
          }, 3000);
        }}
      />

      <LpUnstakeModal
        open={unstakeModalOpen}
        setOpen={setUnstakeModalOpen}
        positions={stakedPositions}
        onSuccess={() => {
          // Wait for blockchain state to update, then refetch
          // Keep modal open so user can see success message and close it manually
          // Clear any existing timeout before setting new one
          if (unstakeTimeoutRef.current) {
            clearTimeout(unstakeTimeoutRef.current);
          }
          unstakeTimeoutRef.current = setTimeout(() => {
            void refetchAll();
          }, 3000);
        }}
      />

      <LpClaimRewardsModal
        open={claimModalOpen}
        setOpen={setClaimModalOpen}
        onSuccess={() => {
          // Wait for blockchain state to update, then refetch
          // Keep modal open so user can see success message and close it manually
          // Clear any existing timeout before setting new one
          if (claimTimeoutRef.current) {
            clearTimeout(claimTimeoutRef.current);
          }
          claimTimeoutRef.current = setTimeout(() => {
            void refetchAll();
          }, 3000);
        }}
      />
    </Card>
  );
}
