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
      <div className="rounded-md bg-primary/5 px-2 py-2 text-2xl dark:bg-primary">
        <h2 className="flex items-center gap-x-1 pb-1 text-sm ">
          <span>Your Staked SIR</span>
        </h2>
        <div className="flex items-center justify-between">
          <div className="text-3xl   ">
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
            </Show>
          </div>
          <Button
            onClick={() => setOpenModal(true)}
            disabled={!isConnected || !Number(stakedSir.unlockedStake)}
            className="py-2"
          >
            Unstake
          </Button>
        </div>
      </div>
    </div>
  );
}
