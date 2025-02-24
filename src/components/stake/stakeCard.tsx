import React, { useState } from "react";
import { Button } from "../ui/button";
import { StakeModal } from "../shared/stake/stakeModal";
import StakeFormProvider from "../providers/stakeFormProvider";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import { TokenDisplay } from "../ui/token-display";
import { Card } from "../ui/card";

export default function StakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: userUnstakedSir } = api.user.getUnstakedSirBalance.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  return (
    <Card variant="secondary">
      <StakeFormProvider>
        <StakeModal open={openModal} setOpen={setOpenModal} />
      </StakeFormProvider>
      <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
        <span>Your Unstaked SIR</span>
      </h2>
      <div className="flex items-center justify-between gap-x-2">
        <TokenDisplay
          amount={userUnstakedSir}
          decimals={12}
          unitLabel={"SIR"}
        />
        {/* <h3 className="overflow-hidden text-xl"> */}
        {/*   {formatNumber(formatUnits(userUnstakedSir ?? 0n, 12), 3)} */}
        {/*   <span className="text-sm text-gray-500"> SIR</span> */}
        {/* </h3> */}
        <Button
          onClick={() => {
            setOpenModal(true);
          }}
          className="py-2"
        >
          Stake
        </Button>
      </div>
    </Card>
  );
}
