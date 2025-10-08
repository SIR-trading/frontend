"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import type { LpPosition } from './types';
import { TokenDisplay } from '@/components/ui/token-display';
import Show from '@/components/shared/show';
import { useAccount } from 'wagmi';
import { getSirSymbol } from '@/lib/assets';

interface LpPositionCardProps {
  position: LpPosition;
  onSubscribe?: (tokenId: bigint) => void;
  onClaim?: (tokenId: bigint) => void;
  onUnstake?: (tokenId: bigint) => void;
  isLoading?: boolean;
}

export function LpPositionCard({
  position,
  onSubscribe,
  onClaim,
  onUnstake,
  isLoading
}: LpPositionCardProps) {
  const { isConnected } = useAccount();

  return (
    <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
      <div className="flex justify-between">
        <div className="flex-1">
          <h2 className="pb-1 text-sm text-muted-foreground">
            Position #{position.tokenId.toString()}
          </h2>
          <div className="flex min-h-[32px] items-end gap-x-4">
            <Show
              when={isConnected}
              fallback={
                <div className="text-sm italic text-foreground">
                  Connect wallet
                </div>
              }
            >
              <div className="flex flex-col gap-y-1">
                <TokenDisplay
                  amount={BigInt(Math.floor(position.valueUsd * 100))}
                  decimals={2}
                  unitLabel="USD"
                  amountSize="large"
                />
                {position.rewardsSir > 0n && (
                  <div className="text-xs text-muted-foreground">
                    Rewards: <TokenDisplay
                      amount={position.rewardsSir}
                      decimals={12}
                      unitLabel={getSirSymbol()}
                      amountSize="small"
                    />
                  </div>
                )}
              </div>
            </Show>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!position.isStaked && onSubscribe && (
            <Button
              onClick={() => onSubscribe(position.tokenId)}
              disabled={isLoading}
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>
          )}

          {position.isStaked && (
            <>
              {position.rewardsSir > 0n && onClaim && (
                <Button
                  onClick={() => onClaim(position.tokenId)}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Claiming...' : 'Claim'}
                </Button>
              )}
              {onUnstake && (
                <Button
                  onClick={() => onUnstake(position.tokenId)}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? 'Unstaking...' : 'Unstake'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}