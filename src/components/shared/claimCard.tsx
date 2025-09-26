import React, { useMemo, useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useClaim } from "../stake/hooks/useClaim";
import TransactionModal from "../shared/transactionModal";
import TransactionSuccess from "../shared/transactionSuccess";
import { TokenDisplay } from "../ui/token-display";
import Show from "./show";
import { getNativeCurrencySymbol } from "@/lib/chains";
import DisplayFormattedNumber from "./displayFormattedNumber";
import { formatUnits } from "viem";
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import { TokenImage } from "./TokenImage";
import { env } from "@/env";
import { useClaimableBalances } from "@/hooks/useClaimableBalances";
import { api } from "@/trpc/react";
import { useNativeTokenUsdPrice } from "./hooks/useNativeTokenUsdPrice";

export default function ClaimCard() {
  const [openModal, setOpenModal] = useState(false);

  const { claimData } = useClaim();

  const { isConnected } = useAccount();

  // Use the context instead of making our own query
  const { dividendsAmount: dividends, isLoading } = useClaimableBalances();
  const dividendsLoading = isLoading;

  // Get USD value for dividends
  const dividendsFormatted = dividends ? formatUnits(dividends, 18) : "0";
  const { usdValue: dividendsUsdValue } = useNativeTokenUsdPrice(dividendsFormatted);

  // Determine glow threshold based on chain
  const glowThreshold = useMemo(() => {
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    const isHyperEVM = chainId === 998 || chainId === 999;
    // 1 HYPE for HyperEVM, 0.01 ETH for Ethereum
    return isHyperEVM ? 1000000000000000000n : 10000000000000000n;
  }, []);

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess: isConfirmed, isLoading: isConfirming } =
    useWaitForTransactionReceipt({ hash });
  const isValid = useMemo(() => {
    if (claimData?.request) {
      return { isValid: true, error: null };
    } else {
      return { isValid: false, error: "Error Occured." };
    }
  }, [claimData?.request]);

  const onSubmit = () => {
    if (claimData?.request) {
      writeContract(claimData?.request);
    }
  };
  const utils = api.useUtils();
  useEffect(() => {
    if (isConfirmed && !openModal) {
      reset();
    }
  }, [isConfirmed, reset, openModal, utils.user.getUserSirDividends]);

  useEffect(() => {
    if (isConfirmed)
      utils.user.getUserSirDividends
        .invalidate()
        .catch((e: unknown) => console.log(e));
  }, [isConfirmed, utils.user.getUserSirDividends]);
  return (
    <div className=" border-secondary-300">
      <TransactionModal.Root
        title={`Claim ${getNativeCurrencySymbol()}`}
        setOpen={setOpenModal}
        open={openModal}
      >
        <TransactionModal.Close setOpen={setOpenModal} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          {!isConfirmed && (
            <div className="space-y-4 px-6 pb-6 pt-4">
              <h2 className="mb-4 text-center text-xl font-semibold">
                Claim {getNativeCurrencySymbol()} Dividends
              </h2>
              <div className="pt-2">
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Amount
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    <DisplayFormattedNumber
                      num={formatUnits(dividends ?? 0n, 18)}
                      significant={3}
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">
                      {getNativeCurrencySymbol()}
                    </span>
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
            </div>
          )}
          {isConfirmed && <TransactionSuccess hash={hash} />}
        </TransactionModal.InfoContainer>
        <div className="mx-4 border-t border-foreground/10" />
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            isPending={isPending}
            isConfirmed={isConfirmed}
            disabled={isPending || isConfirming}
            loading={isConfirming}
            onClick={() => {
              if (isConfirmed) {
                setOpenModal(false);
              } else {
                onSubmit();
              }
            }}
          >
            Claim
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
      <div
        className={`rounded-md bg-primary/5 p-4 dark:bg-primary ${dividends && dividends >= glowThreshold ? "claim-card-subtle-glow" : ""}`}
      >
        <div className="flex justify-between rounded-md text-2xl">
          <div className="flex gap-x-2">
            <div className="flex w-full justify-between">
              <div>
                <h2 className="pb-1 text-sm text-muted-foreground">
                  Dividends
                </h2>
                <div className="flex min-h-[32px] justify-between text-3xl">
                  <div className="flex items-end gap-x-1">
                    <Show
                      when={isConnected && !dividendsLoading}
                      fallback={
                        isConnected ? (
                          <div className="h-8 w-20 animate-pulse rounded bg-foreground/10"></div>
                        ) : (
                          <div className="text-sm italic text-foreground">
                            Connect to claim dividends
                          </div>
                        )
                      }
                    >
                      <TokenDisplay
                        amount={dividends ?? 0n}
                        unitLabel={getNativeCurrencySymbol()}
                      />
                    </Show>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              data-claim-dividends
              disabled={!isConnected || !dividends || !isValid.isValid}
              onClick={() => {
                if (isValid.isValid) setOpenModal(true);
              }}
              className="w-20 py-2"
            >
              Claim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
