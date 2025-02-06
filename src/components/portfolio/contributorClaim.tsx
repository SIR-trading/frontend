import React, { useEffect, useState } from "react";
import TransactionModal from "../shared/transactionModal";
import { TransactionStatus } from "../leverage-liquidity/mintForm/transactionStatus";
import {
  useAccount,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { api } from "@/trpc/react";
import { SirContract } from "@/contracts/sir";
import { CircleCheck } from "lucide-react";
import { Button } from "../ui/button";
import { TokenDisplay } from "../ui/token-display";
import { Checkbox } from "../ui/checkbox";
import Show from "../shared/show";
// import sirIcon from "../../../public/images/sir-logo.svg";
// import type { StaticImageData } from "next/image";

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
  console.log(hash, "HASH");
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
      <TransactionModal.Root setOpen={setOpen} open={open}>
        <TransactionModal.Close setOpen={setOpen} />
        <TransactionModal.InfoContainer>
          <TransactionStatus
            action="Claim"
            waitForSign={isPending}
            showLoading={isConfirming}
            isConfirmed={isConfirmed}
          />
          {!isConfirmed && (
            <div className="space-x-0.5 pt-2">
              <TokenDisplay
                disableRounding
                amount={unclaimedData}
                decimals={12}
                unitLabel={"SIR"}
              />
            </div>
          )}
          {isConfirmed && (
            <div>
              <div className="flex justify-center">
                <CircleCheck size={40} color="#F0C775" />
              </div>
              <h2 className="text-center">Transaction Successful!</h2>
            </div>
          )}
        </TransactionModal.InfoContainer>

        <TransactionModal.StatSubmitContainer>
          <Show when={!isConfirmed}>
            <div className="flex w-full items-center justify-end gap-x-2 py-2 ">
              <label htmlFor="stake" className="text-sm text-gray-200">
                Mint and Stake
              </label>
              <Checkbox
                id="stake"
                checked={checked}
                onCheckedChange={(value) => {
                  setChecked(Boolean(value)); // Call onChange to update the state in UnstakeForm
                }}
              ></Checkbox>
            </div>
          </Show>
          <TransactionModal.SubmitButton
            isConfirmed={isConfirmed}
            loading={isPending || isConfirming}
            disabled={isPending || isConfirming}
            onClick={() => onSubmit()}
          >
            Claim
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>

      <div className="flex  ">
        {data?.request && unclaimedRewards > 0n && (
          <div className="">
            <Button
              onClick={() => setOpen(true)}
              className="w-full space-x-1 bg-gold px-4 py-2 font-bold text-black hover:bg-gold/90"
            >
              <span>Claim Contributor Rewards</span>
              {
                //<span className="">
                //   {formatNumber(formatUnits(unclaimedData ?? 0n, 12), 6)}
                // </span>
              }

              {/* <Image */}
              {/*   height={18} */}
              {/*   width={18} */}
              {/*   src={sirIcon as StaticImageData} */}
              {/*   alt="Sir Icon" */}
              {/* /> */}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
{
  /* <h4 className="px-4 text-center text-[14px] text-gray-300"> */
}
{
  /*   Claim Contributor Rewards */
}
{
  /* </h4> */
}
