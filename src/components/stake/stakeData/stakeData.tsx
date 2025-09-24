"use client";

import type { ReactNode } from "react";
import { TokenDisplay } from "@/components/ui/token-display";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";
import { getSirSymbol } from "@/lib/assets";
import { useStaking } from "@/contexts/StakingContext";

const StakeData = ({ children }: { children: ReactNode }) => {
  const { totalValueLocked, unstakedSupplyLoading, totalSupplyLoading } =
    useStaking();

  const isLoadingTVL = unstakedSupplyLoading || totalSupplyLoading;

  return (
    <div className="mx-auto grid gap-4 font-normal md:grid-cols-2">
      <Card className="flex flex-col items-center justify-center gap-3 rounded-md bg-secondary p-6 transition-colors hover:bg-secondary/80">
        <div className="text-sm font-normal text-muted-foreground">
          Total Stake
        </div>
        <Show
          when={!isLoadingTVL}
          fallback={
            <div className="h-8 w-32 animate-pulse rounded bg-foreground/10"></div>
          }
        >
          <TokenDisplay
            amount={totalValueLocked}
            decimals={12}
            unitLabel={getSirSymbol()}
            className="text-xl"
          />
        </Show>
      </Card>

      {children}
    </div>
  );
};

export default StakeData;
