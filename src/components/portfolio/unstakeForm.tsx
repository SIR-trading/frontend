"use client";
import { Form } from "@/components/ui/form";
import { api } from "@/trpc/react";
import { useFormContext } from "react-hook-form";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import type { TUnstakeFormFields } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { parseUnits, formatUnits } from "viem";
import { useWriteContract } from "wagmi";
import { SirContract } from "@/contracts/sir";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionSuccess from "@/components/shared/transactionSuccess";
import { useGetStakedSir } from "@/components/shared/hooks/useGetStakedSir";
import StakeInput from "@/components/shared/stake/stakeInput";
import ClaimFeesCheckbox from "./claimFeesCheck";
import { useGetReceivedSir } from "./hooks/useGetReceivedSir";
import SubmitButton from "../shared/submitButton";
import ErrorMessage from "../ui/error-message";
import { getSirSymbol, getSirLogo } from "@/lib/assets";
import Image from "next/image";
import { getNativeCurrencySymbol } from "@/lib/chains";
import DisplayFormattedNumber from "../shared/displayFormattedNumber";
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import { TokenImage } from "../shared/TokenImage";
import { useSirUsdPrice } from "../shared/stake/hooks/useSirUsdPrice";
import { useNativeTokenUsdPrice } from "../shared/hooks/useNativeTokenUsdPrice";
import useGetChainId from "@/components/shared/hooks/useGetChainId";
import { env } from "@/env";


const UnstakeForm = ({
  closeUnstakeModal,
}: {
  closeUnstakeModal: () => void;
}) => {
  const form = useFormContext<TUnstakeFormFields>();
  const formData = form.watch();

  const { usdValue: sirUsdValue } = useSirUsdPrice(formData.amount);

  const balance = useGetStakedSir();
  const { address, isConnected } = useAccount();
  const chainId = useGetChainId();

  // Get dividends amount for USD conversion
  const { data: dividends } = api.user.getUserSirDividends.useQuery(
    {
      user: address,
    },
    { enabled: isConnected },
  );

  const dividendsFormatted = dividends ? formatUnits(dividends, 18) : "0";
  const { usdValue: dividendsUsdValue } = useNativeTokenUsdPrice(dividendsFormatted);

  const [unstakeAndClaimFees, setUnstakeAndClaimFees] = useState(false);

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

    if ((balance.unlockedStake ?? 0n) < amount) {
      return { isValid: false, errorMessage: "Insufficient Balance." };
    }

    return { isValid: true, errorMessage: "" };
  }, [formData.amount, balance.unlockedStake, isConnected, chainId]);

  const { writeContract, reset, data: hash, isPending, error: writeError } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });
  const utils = api.useUtils();
  // REFACTOR THIS INTO REUSABLE HOOK
  useEffect(() => {
    if (isConfirmed && form.getValues("amount")) {
      form.resetField("amount");
      utils.user.getUnstakedSirBalance
        .invalidate()
        .catch((e) => console.log(e));
      if (unstakeAndClaimFees) {
        utils.user.getUserSirDividends
          .invalidate()
          .catch((e) => console.log(e));
      }
    }
  }, [
    form,
    isConfirmed,
    unstakeAndClaimFees,
    utils.user.getUnstakedSirBalance,
    utils.user.getUserSirDividends,
  ]);

  const onSubmit = () => {
    const amount = parseUnits(formData.amount ?? "0", 12);
    writeContract({
      ...SirContract,
      functionName: unstakeAndClaimFees ? "unstakeAndClaim" : "unstake",
      args: [amount],
    });
  };

  // Update error display
  useEffect(() => {
    if (errorMessage && errorMessage !== form.formState.errors.root?.message) {
      form.setError("root", { message: errorMessage });
    } else if (!errorMessage && form.formState.errors.root?.message) {
      form.clearErrors("root");
    }
  }, [errorMessage, form]);

  const [open, setOpen] = useState(false);

  // Handler that closes both modals
  const handleSetOpen = (value: boolean) => {
    setOpen(value);
    if (!value) {
      closeUnstakeModal();
    }
  };

  useEffect(() => {
    if (isConfirmed && !open) {
      reset();
    }
  }, [isConfirmed, open, reset]);
  const { tokenReceived } = useGetReceivedSir({
    logs: transactionData?.logs,
    staking: false,
  });
  return (
    <>
      <div className="w-full px-4 py-4">
        <TransactionModal.Root
          title={`Unstake ${getSirSymbol()}`}
          setOpen={handleSetOpen}
          open={open}
        >
          <TransactionModal.Close setOpen={handleSetOpen} />
          <TransactionModal.InfoContainer
            isConfirming={isConfirming}
            hash={hash}
          >
            {!isConfirmed && (
              <>
                <TransactionStatus
                  action="Unstake"
                  waitForSign={isPending}
                  showLoading={isConfirming}
                />
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
                <div className="space-y-4 px-6 pb-6 pt-4">
                  {/* Unstaking Amount */}
                  <div className="pt-2">
                    <div className="mb-2">
                      <label className="text-sm text-muted-foreground">Unstaking Amount</label>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl">
                        <DisplayFormattedNumber
                          num={formatUnits(parseUnits(form.getValues("amount") ?? "0", 12), 12)}
                          significant={undefined}
                        />
                        <span className="text-muted-foreground text-base"> </span>
                      </h3>
                      <div className="flex items-center gap-x-2">
                        <span className="text-foreground/70">{getSirSymbol()}</span>
                        <Image
                          src={getSirLogo()}
                          alt={getSirSymbol()}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                    </div>
                    {sirUsdValue !== null && sirUsdValue > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ≈ $<DisplayFormattedNumber num={sirUsdValue.toString()} />
                      </div>
                    )}
                  </div>

                  {/* Claiming Dividends */}
                  {unstakeAndClaimFees && dividends && parseFloat(formatUnits(dividends, 18)) > 0 && (
                    <div className="pt-2">
                      <div className="mb-2">
                        <label className="text-sm text-muted-foreground">Claiming Dividends</label>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl text-green-400">
                          <DisplayFormattedNumber
                            num={formatUnits(dividends, 18)}
                            significant={3}
                          />
                          <span className="text-muted-foreground text-base"> </span>
                        </h3>
                        <div className="flex items-center gap-x-2">
                          <span className="text-foreground/70">{getNativeCurrencySymbol()}</span>
                          <TokenImage
                            address={WRAPPED_NATIVE_TOKEN_ADDRESS}
                            alt={getNativeCurrencySymbol()}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      {dividendsUsdValue !== null && dividendsUsdValue > 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ≈ $<DisplayFormattedNumber num={dividendsUsdValue.toString()} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            {isConfirmed && (
              <TransactionSuccess
                hash={hash}
                amountReceived={tokenReceived}
                assetReceived={getSirSymbol()}
                assetAddress={SirContract.address}
                decimals={12}
              />
            )}
          </TransactionModal.InfoContainer>
          <div className="mx-4 border-t border-foreground/10" />
          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              isPending={isPending}
              isConfirmed={isConfirmed}
              onClick={() => {
                if (isConfirmed) {
                  handleSetOpen(false); // Close both modals
                } else {
                  onSubmit();
                }
              }}
              loading={isConfirming}
              disabled={!isValid && !isConfirmed}
            >
              Confirm Unstake
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
              isStaking={false}
              form={form}
              balance={formatUnits(balance.unlockedStake ?? 0n, 12)}
            ></StakeInput>
            <ClaimFeesCheckbox
              value={unstakeAndClaimFees}
              dividends={
                Boolean(dividends) ? formatUnits(dividends ?? 0n, 18) : ""
              }
              onChange={setUnstakeAndClaimFees}
            ></ClaimFeesCheckbox>

            <div className=" mt-[20px] flex flex-col items-center justify-center">
              <SubmitButton
                onClick={() => {
                  if (isValid) {
                    setOpen(true);
                  }
                }}
                disabled={!isValid}
              >
                Unstake
              </SubmitButton>
              <ErrorMessage>{form.formState.errors.root?.message}</ErrorMessage>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};

export default UnstakeForm;
