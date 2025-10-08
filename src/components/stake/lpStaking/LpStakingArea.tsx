"use client";
import React, { useState, useCallback } from 'react';
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

export function LpStakingArea() {
  const {
    unstakedPositions,
    stakedPositions,
    totalValueLockedUsd,
    isLoading
  } = useUserLpPositions();

  // Modal states
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [unstakeModalOpen, setUnstakeModalOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    tokenId: bigint;
    liquidity: bigint;
    tickLower: number;
    tickUpper: number;
    isInRange: boolean;
  } | null>(null);

  // Handle stake button click
  const handleStakeClick = useCallback(() => {
    if (unstakedPositions.length > 0) {
      // Use the first unstaked position
      const position = unstakedPositions[0];
      if (position) {
        setSelectedPosition({
          tokenId: position.tokenId,
          liquidity: position.liquidity,
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
          isInRange: position.isInRange,
        });
        setStakeModalOpen(true);
      }
    }
  }, [unstakedPositions]);

  // Handle unstake button click
  const handleUnstakeClick = useCallback(() => {
    if (stakedPositions.length > 0) {
      // Use the first staked position
      const position = stakedPositions[0];
      if (position) {
        setSelectedPosition({
          tokenId: position.tokenId,
          liquidity: position.liquidity,
          tickLower: position.tickLower,
          tickUpper: position.tickUpper,
          isInRange: position.isInRange,
        });
        setUnstakeModalOpen(true);
      }
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
                            <div key={position.tokenId.toString()} className="flex items-center gap-1.5">
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
                                title={`Position #${position.tokenId} - ${position.isInRange ? "In range" : "Out of range"}`}
                              />
                              <span className="text-sm">
                                #{position.tokenId.toString()}
                              </span>
                            </div>
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
                                    <div key={position.tokenId.toString()} className="flex items-center gap-2 py-1">
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
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {position.isInRange ? 'In range' : 'Out of range'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            No unstaked positions
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Add liquidity to SIR/WETH 1% pool
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </div>
              </div>
                {unstakedPositions.length > 0 && !isLoading && (
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
                )}
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
                            <div key={position.tokenId.toString()} className="flex items-center gap-1.5">
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
                                title={`Position #${position.tokenId} - ${position.isInRange ? "In range" : "Out of range"}`}
                              />
                              <span className="text-sm">
                                #{position.tokenId.toString()}
                              </span>
                            </div>
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
                                    <div key={position.tokenId.toString()} className="flex items-center gap-2 py-1">
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
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {position.isInRange ? 'In range' : 'Out of range'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            No staked positions
                          </p>
                        </div>
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
          <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
            <div className="flex justify-between">
              <div className="flex-1">
                <h2 className="pb-1 text-sm text-muted-foreground">
                  SIR Token Rewards
                </h2>
                <div className="flex min-h-[32px] items-center text-3xl">
                  {!isLoading ? (
                    <>
                      {stakedPositions.some(p => p.rewardsSir > 0n) ? (
                        <div>
                          <div className="text-2xl font-semibold">
                            {/* Calculate total rewards */}
                            {stakedPositions.reduce((sum, p) => sum + Number(p.rewardsSir) / 1e12, 0).toFixed(3)} {getSirSymbol()}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Available to claim
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            No rewards available
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  )}
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={!stakedPositions.some(p => p.rewardsSir > 0n)}
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
      {selectedPosition && (
        <LpStakeModal
          open={stakeModalOpen}
          setOpen={setStakeModalOpen}
          positionId={selectedPosition.tokenId}
          liquidity={selectedPosition.liquidity}
          tickLower={selectedPosition.tickLower}
          tickUpper={selectedPosition.tickUpper}
          isInRange={selectedPosition.isInRange}
          onSuccess={() => {
            setStakeModalOpen(false);
            setSelectedPosition(null);
            // Refresh positions will happen automatically via query invalidation
          }}
        />
      )}

      {selectedPosition && (
        <LpUnstakeModal
          open={unstakeModalOpen}
          setOpen={setUnstakeModalOpen}
          positionId={selectedPosition.tokenId}
          liquidity={selectedPosition.liquidity}
          onSuccess={() => {
            setUnstakeModalOpen(false);
            setSelectedPosition(null);
            // Refresh positions will happen automatically via query invalidation
          }}
        />
      )}

      <LpClaimRewardsModal
        open={claimModalOpen}
        setOpen={setClaimModalOpen}
        onSuccess={() => {
          setClaimModalOpen(false);
          // Refresh rewards will happen automatically via query invalidation
        }}
      />
    </Card>
  );
}
