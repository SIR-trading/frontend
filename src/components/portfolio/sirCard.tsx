"use client";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import StakeCard from "./stakeCard";
import { TokenDisplay } from "../ui/token-display";
import Show from "../shared/show";
import { getSirSymbol } from "@/lib/assets";

export function SirCard() {
  const { isConnected, address } = useAccount();
  const { data: totalBalance, isLoading: balanceLoading } =
    api.user.getUnstakedSirBalance.useQuery(
      {
        user: address,
      },
      { enabled: isConnected },
    );
  return (
    <div className="rounded-md bg-primary/5 p-2 pb-2 dark:bg-primary">
      <div className=" flex justify-between rounded-md text-2xl">
        <div className="flex gap-x-2 ">
          <div className="flex w-full justify-between">
            <div>
              <h2 className="pb-1 text-sm text-muted-foreground">
                Your Unstaked Balance
              </h2>
              <div className="flex justify-between text-3xl   ">
                <div className="flex items-end gap-x-1">
                  <Show
                    when={isConnected && !balanceLoading}
                    fallback={
                      isConnected ? (
                        <div className="h-8 w-20 animate-pulse rounded bg-foreground/10"></div>
                      ) : (
                        <div className="text-sm italic text-foreground">
                          Connect to stake
                        </div>
                      )
                    }
                  >
                    <TokenDisplay
                      amount={totalBalance}
                      decimals={12}
                      unitLabel={getSirSymbol()}
                    />
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </div>
        <StakeCard bal={totalBalance} />
      </div>
    </div>
  );
}
