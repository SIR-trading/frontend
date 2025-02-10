"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { useEffect, useState } from "react";

import { type SimulateContractReturnType, parseUnits, formatUnits } from "viem";

import { useWriteContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

import usestakeError from "@/components/stake/hooks/useUnstakeError";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import StakeInput from "../stakeInput";
import { useStake } from "@/components/stake/hooks/useStake";
import type { TUnstakeFormFields } from "@/lib/types";
import { api } from "@/trpc/react";
import { useGetReceivedSir } from "@/components/portfolio/hooks/useGetReceivedSir";
import { useCheckStakeValidity } from "./useCheckStakeValidity";

type SimulateReq = SimulateContractReturnType["request"] | undefined;

const StakeForm = ({ closeStakeModal }: { closeStakeModal: () => void }) => {
  const form = useFormContext<TUnstakeFormFields>();
  const formData = form.watch();

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const { data: balance } = api.user.getUnstakedSirBalance.useQuery(
    { user: address },
    { enabled: isConnected },
  );
  const { stake, isFetching: unstakeFetching } = useStake({
    amount: parseUnits(formData.amount ?? "0", 12),
  });

  const { writeContract, reset, data: hash, isPending } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });
  // REFACTOR THIS INTO REUSABLE HOOK
  const { isValid, errorMessage } = useCheckStakeValidity({
    deposit: formData.amount ?? "0",
    depositToken: SirContract.address,
    requests: {
      mintRequest: stake?.request as SimulateReq,
    },
    tokenBalance: balance,
    mintFetching: unstakeFetching,
    decimals: 12,
  });

  const onSubmit = () => {
    if (stake) {
      writeContract(stake?.request);
    }
  };

  usestakeError({
    formData,
    setError: form.setError,
    errorMessage,
    rootErrorMessage: form.formState.errors.root?.message,
  });

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
        <TransactionModal.Root setOpen={setOpen} open={open}>
          <TransactionModal.Close setOpen={setOpen} />
          <TransactionModal.InfoContainer>
            {!isConfirmed && (
              <>
                <TransactionStatus
                  action="Stake"
                  waitForSign={isPending}
                  showLoading={isConfirming}
                />
                <div className="flex items-center justify-between py-2">
                  <h2 className="text-sm text-gray-400">Amount</h2>
                  <h3 className="text-xl">
                    {form.getValues("amount")}
                    <span className="pl-[2px] text-[12px] text-gray-400">
                      SIR
                    </span>
                  </h3>
                </div>
              </>
            )}
            {isConfirmed && (
              <TransactionSuccess
                decimals={12}
                amountReceived={tokenReceived}
                assetReceived="SIR"
              />
            )}
          </TransactionModal.InfoContainer>
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
              loading={isPending || isConfirming}
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
              {address && (
                <Button
                  variant={"submit"}
                  onClick={() => {
                    if (isValid) {
                      setOpen(true);
                    }
                  }}
                  type="button"
                  disabled={!isValid}
                >
                  Stake
                </Button>
              )}
              {!address && (
                <Button
                  onClick={() => openConnectModal?.()}
                  variant="submit"
                  type="button"
                >
                  Connect Wallet
                </Button>
              )}
              {form.formState.errors.root?.message && (
                <div className="flex w-[450px] items-center justify-center pt-[20px]">
                  <p className="h-[20px] text-center text-sm text-red-400">
                    {address && <>{form.formState.errors.root?.message}</>}
                  </p>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default StakeForm;
