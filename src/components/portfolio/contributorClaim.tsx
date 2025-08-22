import React, { useEffect, useState } from "react";
import {
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { api } from "@/trpc/react";
import { SirContract } from "@/contracts/sir";
import { Button } from "../ui/button";
import { SirRewardsClaimModal } from "../shared/SirRewardsClaimModal";

export default function ContributorClaim() {
  const { isConnected, address } = useAccount();
  const { data: unclaimedData } =
    api.user.getUnclaimedContributorRewards.useQuery(
      { user: address },
      { enabled: isConnected },
    );
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const { data } = useSimulateContract({
    ...SirContract,
    functionName: !checked ? "contributorMint" : "contributorMintAndStake",
  });
  const { writeContract, reset, isPending, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const onSubmit = () => {
    if (isConfirmed) {
      setOpen(false);
      return;
    }
    if (data?.request) {
      writeContract(data?.request);
    }
  };
  const utils = api.useUtils();
  // Invalidate queries after successful tx
  useEffect(() => {
    if (isConfirmed && !open) {
      utils.user.getUnclaimedContributorRewards
        .invalidate()
        .catch((e) => console.log(e));
      utils.user.getUnstakedSirBalance
        .invalidate()
        .catch((e) => console.log(e));
      if (checked) {
        utils.user.getStakedSirPosition
          .invalidate()
          .catch((e) => console.log(e));
      }
      reset();
    }
  }, [
    isConfirmed,
    reset,
    open,
    utils.user.getUnclaimedContributorRewards,
    utils.user.getUnstakedSirBalance,
    utils.user.getTotalSirBalance,
    checked,
    utils.user.getStakedSirPosition,
  ]);
  const unclaimedRewards = unclaimedData ?? 0n;
  return (
    <div>
      <SirRewardsClaimModal
        open={open}
        setOpen={setOpen}
        unclaimedAmount={unclaimedData}
        isPending={isPending}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
        hash={hash}
        claimAndStake={checked}
        setClaimAndStake={setChecked}
        onSubmit={onSubmit}
        title="Claim"
        checkboxLabel="Mint and stake"
      />

      <div className="flex  ">
        {data?.request && unclaimedRewards > 0n && (
          <div className="">
            <Button
              onClick={() => setOpen(true)}
              className="w-full space-x-1 bg-gold px-4 py-2 font-bold text-white hover:bg-gold/90"
            >
              <span>Claim Contributor Rewards</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}