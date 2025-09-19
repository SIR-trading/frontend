"use client";

import { Form } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

import { useEffect, useState } from "react";

import { parseUnits, formatUnits } from "viem";

import { useWriteContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import StakeInput from "../stakeInput";
import { useStake } from "@/components/stake/hooks/useStake";
import type { TUnstakeFormFields } from "@/lib/types";
import { api } from "@/trpc/react";
import { useGetReceivedSir } from "@/components/portfolio/hooks/useGetReceivedSir";
import { useCheckStakeValidity } from "./useCheckStakeValidity";
import SubmitButton from "../../submitButton";
import ErrorMessage from "@/components/ui/error-message";
import { getSirSymbol, getSirLogo } from "@/lib/assets";
import Image from "next/image";
import DisplayFormattedNumber from "../../displayFormattedNumber";


const StakeForm = ({ closeStakeModal }: { closeStakeModal: () => void }) => {
  const form = useFormContext<TUnstakeFormFields>();
  const formData = form.watch();

  const { address, isConnected } = useAccount();

  const { data: balance } = api.user.getUnstakedSirBalance.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  const { stake, isFetching: unstakeFetching } = useStake({
    amount: parseUnits(formData.amount ?? "0", 12),
  });

  const { writeContract, reset, data: hash, isPending, error: writeError } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });
  // REFACTOR THIS INTO REUSABLE HOOK
  console.log("Stake debug:", {
    amount: formData.amount,
    stake,
    unstakeFetching,
    balance,
  });

  const { isValid, errorMessage } = useCheckStakeValidity({
    deposit: formData.amount ?? "0",
    depositToken: SirContract.address,
    requests: {
      mintRequest: stake?.request,
    },
    tokenBalance: balance,
    mintFetching: unstakeFetching,
    decimals: 12,
  });

  console.log("Stake validity:", {
    isValid,
    errorMessage,
  });

  const onSubmit = () => {
    if (stake) {
      writeContract(stake?.request);
    }
  };


  const [open, setOpen] = useState(false);
  const { tokenReceived } = useGetReceivedSir({
    logs: transactionData?.logs,
    staking: true,
  });
  const utils = api.useUtils();
  useEffect(() => {
    if (isConfirmed) {
      utils.user.getTotalSirBalance.invalidate().catch((e) => console.log(e));
      utils.user.getStakedSirPosition.invalidate().catch((e) => console.log(e));
      utils.user.getUnstakedSirBalance
        .invalidate()
        .catch((e) => console.log(e));
      utils.user.getSirSupply.invalidate().catch((e) => console.log(e));
      utils.user.getUnclaimedContributorRewards.invalidate().catch((e) => {
        console.error(e);
      });
    }
  }, [
    isConfirmed,
    utils.user.getSirSupply,
    utils.user.getStakedSirPosition,
    utils.user.getTotalSirBalance,
    utils.user.getUnclaimedContributorRewards,
    utils.user.getUnstakedSirBalance,
  ]);
  useEffect(() => {
    if (isConfirmed && !open) {
      reset();
    }
  }, [isConfirmed, open, reset]);

  return (
    <>
      <div className="w-full px-4 py-4">
        <TransactionModal.Root title={`Stake ${getSirSymbol()}`} setOpen={setOpen} open={open}>
          <TransactionModal.Close setOpen={setOpen} />
          <TransactionModal.InfoContainer
            hash={hash}
            isConfirming={isConfirming}
          >
            {!isConfirmed && (
              <>
                <TransactionStatus
                  action="Stake"
                  waitForSign={isPending}
                  showLoading={isConfirming}
                />

                <div className="space-y-4 px-6 pb-6 pt-4">
                  <div className="pt-2">
                    <div className="mb-2">
                      <label className="text-sm text-muted-foreground">Staking Amount</label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl">
                        <DisplayFormattedNumber
                          num={form.getValues("amount") ?? "0"}
                          significant={undefined}
                        />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-muted-foreground">{getSirSymbol()}</span>
                        <Image
                          src={getSirLogo()}
                          alt={getSirSymbol()}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {writeError && !isConfirming && (() => {
                  // Check if this is a simulation error (not user rejection)
                  const errorMessage = writeError.message || "";
                  const isUserRejection = errorMessage.toLowerCase().includes("user rejected") ||
                                         errorMessage.toLowerCase().includes("user denied") ||
                                         errorMessage.toLowerCase().includes("rejected the request");

                  // Only show error for simulation failures, not user rejections
                  if (!isUserRejection) {
                    return (
                      <div className="mt-3">
                        <p className="text-xs text-center" style={{ color: "#ef4444" }}>
                          Transaction simulation failed. Please check your inputs and try again.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            )}
            {isConfirmed && (
              <TransactionSuccess
                hash={hash}
                decimals={12}
                amountReceived={tokenReceived}
                assetReceived={getSirSymbol()}
                assetAddress={SirContract.address}
              />
            )}
          </TransactionModal.InfoContainer>
          <div className="mx-4 border-t border-foreground/10" />
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              isConfirmed={isConfirmed}
              onClick={() => {
                if (isConfirmed) {
                  setOpen(false);

                  closeStakeModal();
                } else {
                  onSubmit();
                }
              }}
              isPending={isPending}
              loading={isConfirming}
              disabled={!isValid && !isConfirmed}
            >
              Confirm stake
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </TransactionModal.Root>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
          >
            <StakeInput
              isStaking={true}
              form={form}
              balance={formatUnits(balance ?? 0n, 12)}
            ></StakeInput>

            <div className=" mt-[20px] flex flex-col items-center justify-center">
              <SubmitButton
                // error={form.formState.errors.root?.message}
                disabled={!isValid}
                onClick={() => {
                  if (isValid) {
                    setOpen(true);
                  }
                }}
              >
                Stake
              </SubmitButton>
              <ErrorMessage>{form.formState.errors.root?.message}</ErrorMessage>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default StakeForm;
