"use client";
import React, { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LpMetrics } from './LpMetrics';
import { useUserLpPositions } from './hooks/useUserLpPositions';
import { StakeCardWrapper } from '../stakeCardWrapper';
import { getSirSymbol } from '@/lib/assets';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LpStakeModal } from './LpStakeModal';
import { LpUnstakeModal } from './LpUnstakeModal';
import { LpClaimRewardsModal } from './LpClaimRewardsModal';
import HoverPopupMobile from '@/components/ui/hover-popup-mobile';
import DisplayFormattedNumber from '@/components/shared/displayFormattedNumber';

export function LpStakingArea() {
  const {
    unstakedPositions,
    stakedPositions,
    totalValueLockedUsd,
    userRewards,
    isLoading,
    refetchAll
  } = useUserLpPositions();

  // Modal states
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  // Calculate in-range value from staked positions
  const inRangeValueUsd = useMemo(() => {
    return stakedPositions.filter(p => p.isInRange).reduce((sum, p) => sum + p.valueUsd, 0);
  }, [stakedPositions]);

  // Handle stake button click - stakes all unstaked positions
  const handleStakeClick = useCallback(() => {
    if (unstakedPositions.length > 0) {
      setStakeModalOpen(true);
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
      <h2 className="pb-4 text-sm font-medium">
        Uniswap V3 LP Staking
      </h2>

      {/* Metrics at top */}
      <LpMetrics
        totalValueLockedUsd={totalValueLockedUsd}
        inRangeValueUsd={inRangeValueUsd}
        stakingApr={null} // TBD
      />

      {/* LP Position Cards - vertically stacked */}
      <div className="space-y-4">
        {/* LP Positions (Unstaked) */}
        <StakeCardWrapper>
          <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
            <div className="flex justify-between">
              <div className="flex-1">
                <h2 className="pb-1 text-sm text-muted-foreground">
                  LP Positions
                </h2>
                <div className="flex min-h-[32px] items-center text-3xl">
                  {!isLoading ? (
                    <>
                      {unstakedPositions.length > 0 ? (
                        <div className="flex items-center gap-4">
                          {/* Show first 2 positions */}
                          {unstakedPositions.slice(0, 2).map((position) => (
                            <HoverPopupMobile
                              key={position.tokenId.toString()}
                              size="200"
                              trigger={
                                <div className="flex items-center gap-1.5 cursor-pointer">
                                  <span
                                    className={`inline-block rounded-full ${
                                      position.isInRange
                                        ? 'animate-pulse'
                                        : ''
                                    }`}
                                    style={{
                                      width: '14px',
                                      height: '14px',
                                      backgroundColor: position.isInRange ? '#22c55e' : 'rgb(107, 114, 128)',
                                      minWidth: '14px',
                                      minHeight: '14px'
                                    }}
                                  />
                                  <span className="text-sm">
                                    #{position.tokenId.toString()}
                                  </span>
                                </div>
                              }
                            >
                              <div className="space-y-1">
                                <div className="text-[12px]">
                                  Status: <span className={position.isInRange ? 'text-green-500' : 'text-yellow-500'}>
                                    {position.isInRange ? 'In Range' : 'Out of Range'}
                                  </span>
                                </div>
                                <div className="text-[12px]">
                                  Value: ${position.valueUsd > 0 ? (
                                    <DisplayFormattedNumber num={position.valueUsd} significant={3} />
                                  ) : '0'}
                                </div>
                              </div>
                            </HoverPopupMobile>
                          ))}
                          {/* Show popover for additional positions */}
                          {unstakedPositions.length > 2 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                  +{unstakedPositions.length - 2} more
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 max-h-64 overflow-y-auto" align="start">
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    Additional Positions
                                  </div>
                                  {unstakedPositions.slice(2).map((position) => (
                                    <div key={position.tokenId.toString()} className="flex items-center justify-between py-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`inline-block rounded-full ${
                                            position.isInRange
                                              ? 'animate-pulse'
                                              : ''
                                          }`}
                                          style={{
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: position.isInRange ? '#22c55e' : 'rgb(107, 114, 128)',
                                            minWidth: '14px',
                                            minHeight: '14px'
                                          }}
                                        />
                                        <span className="text-sm">
                                          #{position.tokenId.toString()}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground">
                                          {position.isInRange ? 'In range' : 'Out of range'}
                                        </span>
                                        <span className="text-xs">
                                          ${position.valueUsd > 0 ? (
                                            <DisplayFormattedNumber num={position.valueUsd} significant={3} />
                                          ) : '0'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No LP positions
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!unstakedPositions.length}
                  onClick={handleStakeClick}
                  type="button"
                  className="py-2 w-20"
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
              <div className="flex-1">
                <h2 className="pb-1 text-sm text-muted-foreground">
                  Staked LP Positions
                </h2>
                <div className="flex min-h-[32px] items-center text-3xl">
                  {!isLoading ? (
                    <>
                      {stakedPositions.length > 0 ? (
                        <div className="flex items-center gap-4">
                          {/* Show first 2 positions */}
                          {stakedPositions.slice(0, 2).map((position) => (
                            <HoverPopupMobile
                              key={position.tokenId.toString()}
                              size="200"
                              trigger={
                                <div className="flex items-center gap-1.5 cursor-pointer">
                                  <span
                                    className={`inline-block rounded-full ${
                                      position.isInRange
                                        ? 'animate-pulse'
                                        : ''
                                    }`}
                                    style={{
                                      width: '14px',
                                      height: '14px',
                                      backgroundColor: position.isInRange ? '#22c55e' : 'rgb(107, 114, 128)',
                                      minWidth: '14px',
                                      minHeight: '14px'
                                    }}
                                  />
                                  <span className="text-sm">
                                    #{position.tokenId.toString()}
                                  </span>
                                </div>
                              }
                            >
                              <div className="space-y-1">
                                <div className="text-[12px]">
                                  Status: <span className={position.isInRange ? 'text-green-500' : 'text-yellow-500'}>
                                    {position.isInRange ? 'In Range' : 'Out of Range'}
                                  </span>
                                </div>
                                <div className="text-[12px]">
                                  Value: ${position.valueUsd > 0 ? (
                                    <DisplayFormattedNumber num={position.valueUsd} significant={3} />
                                  ) : '0'}
                                </div>
                              </div>
                            </HoverPopupMobile>
                          ))}
                          {/* Show popover for additional positions */}
                          {stakedPositions.length > 2 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                  +{stakedPositions.length - 2} more
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 max-h-64 overflow-y-auto" align="start">
                                <div className="space-y-2">
                                  <div className="text-xs font-medium text-muted-foreground mb-2">
                                    Additional Positions
                                  </div>
                                  {stakedPositions.slice(2).map((position) => (
                                    <div key={position.tokenId.toString()} className="flex items-center justify-between py-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`inline-block rounded-full ${
                                            position.isInRange
                                              ? 'animate-pulse'
                                              : ''
                                          }`}
                                          style={{
                                            width: '14px',
                                            height: '14px',
                                            backgroundColor: position.isInRange ? '#22c55e' : 'rgb(107, 114, 128)',
                                            minWidth: '14px',
                                            minHeight: '14px'
                                          }}
                                        />
                                        <span className="text-sm">
                                          #{position.tokenId.toString()}
                                        </span>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-xs text-muted-foreground">
                                          {position.isInRange ? 'In range' : 'Out of range'}
                                        </span>
                                        <span className="text-xs">
                                          ${position.valueUsd > 0 ? (
                                            <DisplayFormattedNumber num={position.valueUsd} significant={3} />
                                          ) : '0'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No staked positions
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!stakedPositions.length}
                  onClick={handleUnstakeClick}
                  type="button"
                  className="py-2 w-20"
                >
                  Unstake
                </Button>
              </div>
            </div>
          </div>
        </StakeCardWrapper>

        {/* SIR Token Rewards */}
        <StakeCardWrapper>
          <div className={`rounded-md bg-primary/5 p-4 dark:bg-primary ${userRewards >= 100000000000000000n ? "claim-card-gold-glow" : ""}`}>
            <div className="flex justify-between">
              <div className="flex-1">
                <h2 className="pb-1 text-sm text-muted-foreground">
                  SIR Token Rewards
                </h2>
                <div className="flex min-h-[32px] justify-between text-3xl">
                  <div className="flex items-end gap-x-1">
                    {!isLoading ? (
                      <span className="text-xl">
                        {userRewards > 0n ? (
                          <DisplayFormattedNumber num={Number(userRewards) / 1e12} significant={3} />
                        ) : (
                          '0'
                        )}
                        <span className=""> {getSirSymbol()}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!(userRewards > 0n)}
                  onClick={handleClaimClick}
                  type="button"
                  className="py-2 w-20"
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
          setTimeout(() => {
            void refetchAll().then(() => {
              // Close modal after refetch to ensure UI updates
              setStakeModalOpen(false);
            });
          }, 3000);
        }}
      />

      <LpUnstakeModal
        open={unstakeModalOpen}
        setOpen={setUnstakeModalOpen}
        positions={stakedPositions}
        onSuccess={() => {
          // Wait for blockchain state to update, then refetch
          setTimeout(() => {
            void refetchAll().then(() => {
              // Close modal after refetch to ensure UI updates
              setUnstakeModalOpen(false);
            });
          }, 3000);
        }}
      />

      <LpClaimRewardsModal
        open={claimModalOpen}
        setOpen={setClaimModalOpen}
        onSuccess={() => {
          // Wait for blockchain state to update, then refetch
          setTimeout(() => {
            void refetchAll().then(() => {
              // Close modal after refetch to ensure UI updates
              setClaimModalOpen(false);
            });
          }, 3000);
        }}
      />
    </Card>
  );
}
