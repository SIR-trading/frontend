"use client";

import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import UnstakeInput from "./unstakeInput";
import type { TUnstakeFormFields } from "@/lib/types";
import ClaimFeesCheckbox from "@/components/stake/unstakeForm/claimFeesCheck";
import { useEffect, useMemo, useState } from "react";

import { type SimulateContractReturnType, parseUnits, formatUnits } from "viem";
import { z } from "zod";
import { useUnstake } from "../hooks/useUnstake";

import { useWriteContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

import useUnstakeError from "@/components/stake/hooks/useUnstakeError";
import { useCheckSubmitValid } from "@/components/leverage-liquidity/mintForm/hooks/useCheckSubmitValid";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionSuccess from "@/components/shared/transactionSuccess";

type SimulateReq = SimulateContractReturnType["request"] | undefined;
interface Props {
  balance: bigint | undefined;
  dividends?: string;
  claimSimulate: SimulateReq;
  claimResult: bigint | undefined;
  claimFetching: boolean;
}

const UnstakeForm = ({
  balance,
  dividends,
  claimSimulate,
  claimResult,
  claimFetching,
}: Props) => {
  console.log({ balance });
  const form = useFormContext<TUnstakeFormFields>();
  const formData = form.watch();

  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const safeAmount = useMemo(() => {
    return z.coerce.number().safeParse(formData.amount);
  }, [formData.amount]);

  const { Unstake, isFetching: unstakeFetching } = useUnstake({
    amount: safeAmount.success
      ? parseUnits(safeAmount.data.toString() ?? "0", 12)
      : undefined,
  });

  const { writeContract, reset, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });
  const utils = api.useUtils();
  // REFACTOR THIS INTO REUSABLE HOOK
  useEffect(() => {
    if (isConfirmed && form.getValues("amount")) {
      form.resetField("amount");
      utils.user.getUnstakedSirBalance
        .invalidate()
        .catch((e) => console.log(e));
    }
  }, [form, isConfirmed, utils.user.getUnstakedSirBalance]);
  const { isValid, errorMessage } = useCheckSubmitValid({
    deposit: safeAmount.success ? safeAmount.data.toString() : "0",
    depositToken: SirContract.address,
    requests: {
      mintRequest: Unstake?.request as SimulateReq,
      approveWriteRequest: claimSimulate,
    },
    tokenBalance: balance,
    mintFetching: unstakeFetching,
    approveFetching: claimFetching,
    decimals: 12,
  });

  const [claimFees, setClaimFees] = useState(false);
  const onSubmit = () => {
    if (Unstake && claimSimulate) {
      if (Boolean(claimResult) && claimFees) {
        writeContract(Unstake?.request);
        writeContract(claimSimulate);
        return;
      } else {
        console.log("here");
        writeContract(Unstake?.request);

        return;
      }
    }
  };

  useUnstakeError({
    formData,
    setError: form.setError,
    errorMessage,
    rootErrorMessage: form.formState.errors.root?.message,
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isConfirmed && !open) {
      reset();
    }
  }, [isConfirmed, open, reset]);
  let submitButtonText = "Confirm Unstake";
  if (isPending || isConfirming) {
    submitButtonText = "Pending...";
  }
  if (isConfirmed) {
    submitButtonText = "Close";
  }

  return (
    <>
      <Card className="w-full ">
        <TransactionModal.Root setOpen={setOpen} open={open}>
          <TransactionModal.Close setOpen={setOpen} />
          <TransactionModal.InfoContainer>
            {!isConfirmed && (
              <>
                <TransactionStatus
                  action="Unstake"
                  waitForSign={isPending}
                  isTxPending={isConfirming}
                />
                <div className="py-2 flex justify-between items-center">
                  <h2 className="text-gray-400 text-sm">Amount</h2>
                  <h3 className="text-xl">
                    {form.getValues("amount")}
                    <span className="text-gray-400 pl-[2px] text-[12px]">
                      SIR
                    </span>
                  </h3>
                </div>
              </>
            )}
            {isConfirmed && (
              <TransactionSuccess amountReceived={100n} assetReceived="SIR" />
            )}
          </TransactionModal.InfoContainer>
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              onClick={() => {
                if (isConfirmed) {
                  setOpen(false);
                } else {
                  onSubmit();
                }
              }}
              loading={isPending || isConfirming}
              disabled={!isValid && !isConfirmed}
            >
              {submitButtonText}
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
            <UnstakeInput
              form={form}
              balance={formatUnits(balance ?? 0n, 12)}
            ></UnstakeInput>
            <ClaimFeesCheckbox
              form={form}
              dividends={dividends}
              disabled={!Boolean(claimResult)}
              onChange={setClaimFees}
            ></ClaimFeesCheckbox>

            <div className=" flex-col flex items-center justify-center mt-[20px]">
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
                  Unstake
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
                <div className="w-[450px] pt-[20px] flex justify-center items-center">
                  <p className="h-[20px] text-center text-sm text-red-400">
                    {address && <>{form.formState.errors.root?.message}</>}
                  </p>
                </div>
              )}
            </div>
          </form>
        </Form>
      </Card>
    </>
  );
};

export default UnstakeForm;
