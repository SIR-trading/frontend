import React, { useState } from "react";
import { Button } from "../ui/button";
import { StakeModal } from "../shared/stake/stakeModal";
import StakeFormProvider from "../providers/stakeFormProvider";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import { TokenDisplay } from "../ui/token-display";
import Show from "../shared/show";

export default function StakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { 
    data: userUnstakedSir, 
    isLoading: unstakedSirLoading 
  } = api.user.getUnstakedSirBalance.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  return (
    <div className="rounded-md bg-primary/5 p-2 pb-2 dark:bg-primary">
      <StakeFormProvider>
        <StakeModal open={openModal} setOpen={setOpenModal} />
      </StakeFormProvider>
      <div className="flex justify-between rounded-md text-2xl">
        <div className="flex gap-x-2">
          <div className="flex w-full justify-between">
            <div>
              <h2 className="pb-1 text-sm text-muted-foreground">
                Your Unstaked SIR
              </h2>
              <div className="flex justify-between text-3xl">
                <div className="flex items-end gap-x-1">
                  <Show 
                    when={isConnected && !unstakedSirLoading} 
                    fallback={
                      isConnected ? (
                        <div className="h-8 w-20 bg-foreground/10 rounded animate-pulse"></div>
                      ) : (
                        <div className="text-sm text-foreground italic">
                          Connect to start staking
                        </div>
                      )
                    }
                  >
                    <TokenDisplay
                      amount={userUnstakedSir}
                      decimals={12}
                      unitLabel={"SIR"}
                    />
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-end">
          <Button
            onClick={() => {
              setOpenModal(true);
            }}
            disabled={!isConnected || !Number(userUnstakedSir)}
            className="py-2 w-20"
          >
            Stake
          </Button>
        </div>
      </div>
    </div>
  );
}
