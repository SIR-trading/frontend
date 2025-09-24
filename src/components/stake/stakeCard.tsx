import React, { useState } from "react";
import { Button } from "../ui/button";
import { StakeModal } from "../shared/stake/stakeModal";
import StakeFormProvider from "../providers/stakeFormProvider";
import { useAccount } from "wagmi";
import { useStaking } from "@/contexts/StakingContext";

export default function StakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const { isConnected } = useAccount();
  const { unstakedBalance: userUnstakedSir } = useStaking();
  return (
    <div className="rounded-md bg-primary/5 p-4 dark:bg-primary">
      <StakeFormProvider>
        <StakeModal open={openModal} setOpen={setOpenModal} />
      </StakeFormProvider>
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-sm text-muted-foreground">
          Stake More SIR
        </h2>
        <Button
          onClick={() => {
            setOpenModal(true);
          }}
          disabled={!isConnected || !Number(userUnstakedSir)}
          className="w-full"
        >
          Stake
        </Button>
      </div>
    </div>
  );
}
