import { Button } from "../ui/button";
import UnstakeFormProvider from "../providers/unstakeFormProvider";
import { UnstakeModal } from "./unstakeModal";
import { useState } from "react";
import { useGetStakedSir } from "../shared/hooks/useGetStakedSir";
import { TokenDisplay } from "../ui/token-display";

export function UnstakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const stakedSir = useGetStakedSir();
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
            {/* <h4> */}
            {/*   <span>{formatNumber(formatUnits(stakedSir ?? 0n, 12))}</span> */}
            {/*   <span className="text-sm text-foreground/70"> SIR</span> */}
            {/* </h4> */}
          </div>
          <Button
            onClick={() => setOpenModal(true)}
            disabled={stakedSir.unlockedStake === 0n}
            className="py-2"
          >
            Unstake
          </Button>
        </div>
      </div>
    </div>
  );
}
