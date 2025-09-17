import { Button } from "../ui/button";
import UnstakeFormProvider from "../providers/unstakeFormProvider";
import { UnstakeModal } from "./unstakeModal";
import { useState } from "react";
import { TokenDisplay } from "../ui/token-display";
import Show from "../shared/show";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { getSirSymbol } from "@/lib/assets";
import { Lock, LockOpen } from "lucide-react";

export function UnstakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const { isConnected, address } = useAccount();
  const { data: stakedPosition, isLoading: stakedPositionLoading } =
    api.user.getStakedSirPosition.useQuery(
      { user: address ?? "0x" },
      { enabled: isConnected },
    );

  const stakedSir = stakedPosition ?? { unlockedStake: 0n, lockedStake: 0n };

  return (
    <div className=" border-secondary-300">
      <UnstakeFormProvider>
        <UnstakeModal open={openModal} setOpen={setOpenModal} />
      </UnstakeFormProvider>
      <div className="rounded-md bg-primary/5 p-2 pb-2 dark:bg-primary">
        <div className="flex justify-between rounded-md text-2xl">
          <div className="flex gap-x-2">
            <div className="flex w-full justify-between">
              <div>
                <h2 className="pb-1 text-sm text-muted-foreground">
                  Your Stake
                </h2>
                <div className="flex justify-between text-3xl">
                  <div className="flex items-end gap-x-1">
                    <Show
                      when={isConnected && !stakedPositionLoading}
                      fallback={
                        isConnected ? (
                          <div className="space-y-2">
                            <div className="h-6 w-24 animate-pulse rounded bg-foreground/10"></div>
                            <div className="h-6 w-24 animate-pulse rounded bg-foreground/10"></div>
                          </div>
                        ) : (
                          <div className="text-sm italic text-foreground">
                            Connect to unstake
                          </div>
                        )
                      }
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 group relative">
                          <LockOpen className="h-4 w-4 text-muted-foreground" />
                          <TokenDisplay
                            amount={stakedSir.unlockedStake}
                            decimals={12}
                            unitLabel={getSirSymbol()}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background/95 border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Available to withdraw anytime
                          </div>
                        </div>
                        <div className="flex items-center gap-1 group relative">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <TokenDisplay
                            amount={stakedSir.lockedStake}
                            decimals={12}
                            unitLabel={getSirSymbol()}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-background/95 border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Locked stake cannot be withdrawn yet
                          </div>
                        </div>
                      </div>
                    </Show>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => setOpenModal(true)}
              disabled={!isConnected || !Number(stakedSir.unlockedStake)}
              className="w-20 py-2"
            >
              Unstake
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
