import React, { useState } from "react";
import { Button } from "../ui/button";
import { formatEther } from "viem";
import { StakeModal } from "../shared/stake/stakeModal";
import StakeFormProvider from "../providers/stakeFormProvider";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";

export default function StakeCard() {
  const [openModal, setOpenModal] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: userUnstakedSir } = api.user.getTotalSirBalance.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  return (
    <div className="rounded-md bg-secondary-400 px-2 py-2 text-2xl">
      <StakeFormProvider>
        <StakeModal open={openModal} setOpen={setOpenModal} />
      </StakeFormProvider>
      <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
        <span>Staked Sir</span>
      </h2>
      <div className="flex items-center justify-between gap-x-2">
        <h3 className="overflow-hidden text-xl">
          {formatEther(userUnstakedSir ?? 0n)}
          <span className="text-sm text-gray-500"> SIR</span>
        </h3>
        <Button
          onClick={() => {
            setOpenModal(true);
          }}
          className="py-2"
        >
          Stake
        </Button>
      </div>
    </div>
  );
}
