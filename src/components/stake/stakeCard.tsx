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
    <div className="rounded-md bg-primary/5 px-2 py-2 text-2xl dark:bg-primary">
      <StakeFormProvider>
        <StakeModal open={openModal} setOpen={setOpenModal} />
      </StakeFormProvider>
      <h2 className="flex items-center gap-x-1 pb-1 text-sm text-foreground/80 ">
        <span>Your Unstaked SIR</span>
      </h2>
      <div className="flex items-center justify-between gap-x-2">
        <Show 
          when={isConnected && !unstakedSirLoading} 
          fallback={
            isConnected ? (
              <div className="h-8 w-20 bg-foreground/10 rounded animate-pulse"></div>
            ) : (
              <div className="text-sm text-foreground/60">
                Connect wallet to view
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
        {/* <h3 className="overflow-hidden text-xl"> */}
        {/*   {formatNumber(formatUnits(userUnstakedSir ?? 0n, 12), 3)} */}
        {/*   <span className="text-sm text-foreground/70"> SIR</span> */}
        {/* </h3> */}
        <Button
          onClick={() => {
            setOpenModal(true);
          }}
          disabled={!isConnected || !Number(userUnstakedSir)}
          className="py-2"
        >
          Stake
        </Button>
      </div>
    </div>
  );
}
