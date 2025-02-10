import React from "react";
import { Button } from "../ui/button";
import { StakeModal } from "../shared/stake/stakeModal";
import StakeFormProvider from "../providers/stakeFormProvider";
import { useState } from "react";
export default function StakeCard({ bal }: { bal: bigint | undefined }) {
  const [stakeModal, setStakeModal] = useState(false);

  return (
    <div className="flex items-end">
      <div>
        <Button
          disabled={bal === 0n || !bal}
          onClick={() => setStakeModal(true)}
          type="button"
          className="p-2"
        >
          Stake
        </Button>
        <StakeFormProvider>
          <StakeModal setOpen={setStakeModal} open={stakeModal}></StakeModal>
        </StakeFormProvider>
      </div>
    </div>
  );
}
