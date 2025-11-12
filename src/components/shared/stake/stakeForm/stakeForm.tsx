"use client";

import { Form } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { useWaitForTransactionReceipt, useAccount } from "wagmi";

import { useEffect, useState, useMemo } from "react";

import { parseUnits, formatUnits } from "viem";

import { useWriteContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import StakeInput from "../stakeInput";
import type { TUnstakeFormFields } from "@/lib/types";
import { api } from "@/trpc/react";
import { useGetReceivedSir } from "@/components/portfolio/hooks/useGetReceivedSir";
import SubmitButton from "../../submitButton";
import ErrorMessage from "@/components/ui/error-message";
import { getSirSymbol, getSirLogo } from "@/lib/assets";
import Image from "next/image";
import DisplayFormattedNumber from "../../displayFormattedNumber";
import { useStaking } from "@/contexts/StakingContext";
import { useSirUsdPrice } from "../hooks/useSirUsdPrice";
import useGetChainId from "@/components/shared/hooks/useGetChainId";
import { env } from "@/env";


const StakeForm = ({ closeStakeModal }: { closeStakeModal: () => void }) => {
  const form = useFormContext<TUnstakeFormFields>();
  const formData = form.watch();

  const { usdValue } = useSirUsdPrice(formData.amount);
  const { isConnected } = useAccount();
  const chainId = useGetChainId();

  const { unstakedBalance: balance } = useStaking();

  // Simple validation without simulation
  const { isValid, errorMessage } = useMemo(() => {
    if (!isConnected) {
      return { isValid: false, errorMessage: "Connect wallet" };
    }

    if (chainId?.toString() !== env.NEXT_PUBLIC_CHAIN_ID && Boolean(chainId)) {
      return { isValid: false, errorMessage: "Wrong network!" };
    }

    const amount = parseUnits(formData.amount ?? "0", 12);

    if (amount <= 0n) {
      return { isValid: false, errorMessage: "Enter amount greater than 0." };
    }

    if ((balance ?? 0n) < amount) {
      return { isValid: false, errorMessage: "Insufficient Balance." };
    }

    return { isValid: true, errorMessage: "" };
  }, [formData.amount, balance, isConnected, chainId]);

  const { writeContract, reset, data: hash, isPending, error: writeError } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });

  const onSubmit = () => {
    const amount = parseUnits(formData.amount ?? "0", 12);
    writeContract({
      ...SirContract,
      functionName: "stake",
      args: [amount],
    });
  };


  const [open, setOpen] = useState(false);

  // Handler that closes both modals
  const handleSetOpen = (value: boolean) => {
    setOpen(value);
    if (!value) {
      closeStakeModal();
    }
  };
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

  // Update error display
  useEffect(() => {
    if (errorMessage && errorMessage !== form.formState.errors.root?.message) {
      form.setError("root", { message: errorMessage });
    } else if (!errorMessage && form.formState.errors.root?.message) {
      form.clearErrors("root");
    }
  }, [errorMessage, form]);

  return (
    <>
      <div className="w-full px-4 py-4">
        <TransactionModal.Root
          title={`Stake ${getSirSymbol()}`}
          setOpen={handleSetOpen}
          open={open}
        >
          <TransactionModal.Close setOpen={handleSetOpen} />
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
                    {usdValue !== null && usdValue > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ $<DisplayFormattedNumber num={usdValue.toString()} />
                      </div>
                    )}
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
                  handleSetOpen(false); // Close both modals
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
