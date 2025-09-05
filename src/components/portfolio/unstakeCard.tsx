import { Button } from "../ui/button";
import UnstakeFormProvider from "../providers/unstakeFormProvider";
import { UnstakeModal } from "./unstakeModal";
import { useState } from "react";
import { TokenDisplay } from "../ui/token-display";
import Show from "../shared/show";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";

export function UnstakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const { isConnected, address } = useAccount();
  const { data: stakedPosition, isLoading: stakedPositionLoading } = api.user.getStakedSirPosition.useQuery(
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
                  Your Staked SIR
                </h2>
                <div className="flex justify-between text-3xl">
                  <div className="flex items-end gap-x-1">
                    <Show 
                      when={isConnected && !stakedPositionLoading} 
                      fallback={
                        isConnected ? (
                          <div className="space-y-2">
                            <div className="h-6 w-24 bg-foreground/10 rounded animate-pulse"></div>
                            <div className="h-6 w-24 bg-foreground/10 rounded animate-pulse"></div>
                          </div>
                        ) : (
                          <div className="text-sm text-foreground/60">
                            Connect wallet to view
                          </div>
                        )
                      }
                    >
                      <div className="flex flex-col">
                        <TokenDisplay
                          amount={stakedSir.unlockedStake}
                          decimals={12}
                          unitLabel={"SIR Unlocked"}
                        />
                        <TokenDisplay
                          amount={stakedSir.lockedStake}
                          decimals={12}
                          unitLabel={"SIR Locked"}
                        />
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
              className="py-2 w-20"
            >
              Unstake
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
