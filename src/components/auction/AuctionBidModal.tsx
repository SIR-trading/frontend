import { Dialog, DialogContent } from "@/components/ui/dialog";
import TransactionModal from "@/components/shared/transactionModal";
import AuctionBidInputs from "./bid-inputs";
import { TokenImage } from "@/components/shared/TokenImage";
import { formatEther, parseEther } from "viem";
import useAuctionTokenInfo from "@/components/auction/hooks/useAuctionTokenInfo";
import { useFormContext } from "react-hook-form";
import type { TAuctionBidFormFields } from "@/components/providers/auctionBidFormProvider";
import { useBid } from "@/components/auction/hooks/auctionSimulationHooks";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useResetAfterApprove } from "@/components/leverage-liquidity/mintForm/hooks/useResetAfterApprove";
import { useCallback, useMemo, useState, useEffect } from "react";
import { WRAPPED_NATIVE_TOKEN_ADDRESS, NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import { getNativeCurrencySymbol } from "@/lib/chains";
import React from "react";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import ExplorerLink from "@/components/shared/explorerLink";
import useResetAuctionsOnSuccess from "@/components/auction/hooks/useResetAuctionsOnSuccess";
import Show from "@/components/shared/show";
import ToolTip from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import {
  getAuctionBidIncreasePercentage,
  getWrappedTokenSymbol,
  isHyperEVM,
} from "@/lib/chains";

export type TAuctionBidModalState = {
  open: boolean;
  id?: string;
  bid?: bigint;
  isTopUp?: boolean;
};

interface Props {
  open: TAuctionBidModalState;
  setOpen: (b: TAuctionBidModalState) => void;
}

export function AuctionBidModal({ open, setOpen }: Props) {
  const [maxApprove, setMaxApprove] = useState(false);
  const [confirmedBidAmount, setConfirmedBidAmount] = useState<string>("");
  const [useNativeToken, setUseNativeToken] = useState(false);

  const { id: tokenAddress, bid: currentBid, isTopUp } = open;

  const form = useFormContext<TAuctionBidFormFields>();

  const formData = form.watch();

  const { userBalance, userNativeTokenBalance, userBalanceFetching, needsApproval, approveRequest } =
    useAuctionTokenInfo({
      tokenAddress: WRAPPED_NATIVE_TOKEN_ADDRESS,
      amount: formData.bid,
      isOpen: open.open,
      maxApprove,
      useNativeToken,
    });

  // Reset useNativeToken when modal opens, then auto-enable if needed
  useEffect(() => {
    if (open.open) {
      // Reset to default (false = wrapped token)
      setUseNativeToken(false);

      // Then auto-enable only if wrapped balance is 0 and native balance > 0
      if (
        isHyperEVM() &&
        userBalance?.tokenBalance?.result === 0n &&
        userNativeTokenBalance &&
        userNativeTokenBalance > 0n
      ) {
        setUseNativeToken(true);
      }
    }
  }, [open.open, userBalance?.tokenBalance?.result, userNativeTokenBalance]);

  const { request: bidRequest, refetch: reSimulateBid } = useBid({
    token: tokenAddress,
    amount: formData.bid,
    useNativeToken,
  });

  const balance = useNativeToken
    ? userNativeTokenBalance
    : userBalance?.tokenBalance?.result;

  const bidIncreasePercentage = getAuctionBidIncreasePercentage();
  const wrappedTokenSymbol = getWrappedTokenSymbol();
  const bidIncreaseMultiplier = BigInt(100 + bidIncreasePercentage);

  const nextBid = useMemo(
    () => ((currentBid ?? BigInt(0)) * bidIncreaseMultiplier) / BigInt(100),
    [currentBid, bidIncreaseMultiplier],
  );

  const {
    writeContract,
    reset,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });

  const onSubmit = useCallback(async () => {
    if (approveRequest && needsApproval) {
      writeContract(approveRequest);
      return;
    }

    if (bidRequest && !isConfirmed) {
      // Store the bid amount before submitting (for success screen)
      // For top-ups, show the total bid amount (current + top-up)
      const displayAmount = isTopUp
        ? formatEther((currentBid ?? 0n) + parseEther(formData.bid))
        : formData.bid;
      setConfirmedBidAmount(displayAmount);
      writeContract(bidRequest);
      return;
    }

    // When closing after confirmation, reset everything
    setOpen({ open: false });
    setConfirmedBidAmount("");
    reset();
    form.reset();
  }, [
    approveRequest,
    bidRequest,
    isConfirmed,
    needsApproval,
    setOpen,
    writeContract,
    formData.bid,
    isTopUp,
    currentBid,
    form,
    reset,
  ]);

  useResetAfterApprove({
    isConfirmed,
    reset: () => {
      reset();
      reSimulateBid()
        .then((r) => r)
        .catch((e) => console.log(e));
    },
    needsApproval,
  });

  useResetAuctionsOnSuccess({
    isConfirming: Boolean(isConfirming && bidRequest),
    isConfirmed: Boolean(isConfirmed && bidRequest),
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
    auctionType: "ongoing",
    actions: () => {
      console.log("Taking Actions");
      form.reset();
      // Don't auto-close anymore - let user close manually after seeing success
    },
  });

  const errorMessage = useMemo(() => {
    if (!isConfirmed) {
      if (!userBalanceFetching) {
        if (!balance)
          return `You don't have enough ${wrappedTokenSymbol} to ${isTopUp ? "top up" : "place"} this bid.`;
        if (parseEther(formData.bid) > balance) {
          return `Bid exceeds your ${wrappedTokenSymbol} balance.`;
        }
        if (Number(formData.bid) > 0) {
          if (!isTopUp && Number(formData.bid) <= +formatEther(nextBid)) {
            return `Bid must be ${bidIncreasePercentage}% higher than the current bid`;
          }
          if (
            isTopUp &&
            Number(formData.bid) <=
              +formatEther(nextBid - (currentBid ?? BigInt(0)))
          ) {
            return `Top up must be ${bidIncreasePercentage}% higher than the current bid.`;
          }
        }
      }
    }
  }, [
    balance,
    currentBid,
    formData.bid,
    isConfirmed,
    isTopUp,
    bidIncreasePercentage,
    wrappedTokenSymbol,
    nextBid,
    userBalanceFetching,
  ]);

  const isSimulationFailure = useMemo(() => {
    if (writeError && !isConfirming && !isConfirmed) {
      const errorMsg = writeError.message || "";
      const isUserRejection =
        errorMsg.toLowerCase().includes("user rejected") ||
        errorMsg.toLowerCase().includes("user denied") ||
        errorMsg.toLowerCase().includes("rejected the request");
      return !isUserRejection;
    }
    return false;
  }, [writeError, isConfirming, isConfirmed]);

  return (
    <Dialog
      open={open.open}
      onOpenChange={(open) => {
        setOpen({ open });
        // Reset everything when closing the modal
        if (!open) {
          setConfirmedBidAmount("");
          reset();
          form.reset();
        }
      }}
    >
      <DialogContent title="Auction Bid Modal" className="bg-transparent">
        <div
          className={`nav-shadow relative rounded-xl border border-foreground/10 bg-secondary pt-4  transition-all duration-700 `}
        >
          <TransactionModal.Close
            setOpen={(open) => {
              setOpen({ open });
              // Reset everything when closing the modal
              if (!open) {
                setConfirmedBidAmount("");
                reset();
                form.reset();
              }
            }}
          />
          <h1 className="text-center font-geist text-2xl">
            {isTopUp ? "Top up bid" : "Place bid"}{" "}
          </h1>

          {/* Show success state when transaction is confirmed and it's a bid (not approval) */}
          <Show when={isConfirmed && !needsApproval} fallback={
            <>
              <AuctionBidInputs.Root>
                <AuctionBidInputs.Inputs
                  decimals={18}
                  disabled={false}
                  inputLoading={false}
                  balance={formatEther(balance ?? BigInt(0))}
                  currentBid={formatEther(currentBid ?? BigInt(0))}
                  nextBid={formatEther(nextBid)}
                  isTopUp={isTopUp}
                  useNativeToken={useNativeToken}
                  setUseNativeToken={setUseNativeToken}
                >
                  <div className="flex items-center gap-2">
                    <p>{useNativeToken ? getNativeCurrencySymbol() : wrappedTokenSymbol}</p>
                    <TokenImage
                      address={useNativeToken ? NATIVE_TOKEN_ADDRESS : WRAPPED_NATIVE_TOKEN_ADDRESS}
                      alt="alt"
                      width={25}
                      height={25}
                      className="rounded-full"
                    />
                  </div>
                </AuctionBidInputs.Inputs>

                <div className="flex flex-col items-center justify-center gap-2 p-4">
                  <TransactionStatus
                    showLoading={isConfirming}
                    waitForSign={isPending}
                    action={""}
                  />

                  <ExplorerLink align="left" transactionHash={hash} />

                  {writeError &&
                    !isConfirming &&
                    !isConfirmed &&
                    (() => {
                      // Check if this is a simulation error (not user rejection)
                      const errorMessage = writeError.message || "";
                      const isUserRejection =
                        errorMessage.toLowerCase().includes("user rejected") ||
                        errorMessage.toLowerCase().includes("user denied") ||
                        errorMessage.toLowerCase().includes("rejected the request");

                      // Only show error for simulation failures, not user rejections
                      if (!isUserRejection) {
                        return (
                          <div className="mt-2">
                            <p
                              className="text-center text-xs"
                              style={{ color: "#ef4444" }}
                            >
                              Transaction simulation failed. Please check your
                              inputs and try again.
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                </div>
              </AuctionBidInputs.Root>
            </>
          }>
            {/* Success state content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-4 p-8"
            >
              <div className="flex justify-center">
                <CircleCheck size={60} color="hsl(173, 73%, 36%)" />
              </div>
              <h2 className="text-center text-xl font-semibold">
                {isTopUp ? "Bid Topped Up!" : "Bid Placed Successfully!"}
              </h2>
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    {isTopUp ? "Your Total Bid" : "Your Bid Amount"}
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-2xl font-mono">
                      <DisplayFormattedNumber
                        num={confirmedBidAmount || formData.bid}
                        significant={6}
                      />
                    </span>
                    <div className="flex items-center gap-1">
                      <TokenImage
                        address={WRAPPED_NATIVE_TOKEN_ADDRESS}
                        alt={wrappedTokenSymbol}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-2xl font-mono text-muted-foreground">
                        {wrappedTokenSymbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <ExplorerLink transactionHash={hash} align="center" />
            </motion.div>
          </Show>

          <TransactionModal.StatSubmitContainer>
            <Show when={!isConfirmed && needsApproval && !errorMessage}>
              {" "}
              <div className="flex w-full justify-between gap-x-1">
                <div className="flex items-center gap-x-1">
                  <span className="text-sm text-foreground/60">
                    Approve for maximum amount
                  </span>
                  <ToolTip>
                    Max approval avoids repeat approvals but grants full fund
                    access. Only use with trusted contracts.
                  </ToolTip>
                </div>{" "}
                <Checkbox
                  checked={maxApprove}
                  onCheckedChange={(e) => {
                    setMaxApprove(Boolean(e));
                  }}
                  className="border border-foreground bg-foreground/5"
                ></Checkbox>
              </div>
            </Show>
            <Show when={!!errorMessage}>
              <div className="text-sm text-red">{errorMessage}</div>
            </Show>
            <TransactionModal.SubmitButton
              onClick={onSubmit}
              disabled={
                // Don't disable the button when showing success state
                isConfirmed && !needsApproval
                  ? false
                  : userBalanceFetching ||
                    (Number(formData.bid) === 0 && !isConfirmed) ||
                    (!balance && !isConfirmed) ||
                    isSimulationFailure ||
                    (parseEther(formData.bid) > balance! && !isConfirmed) ||
                    (!isConfirmed && isTopUp
                      ? Number(formData.bid) <=
                        +formatEther(nextBid - (currentBid ?? BigInt(0)))
                      : Number(formData.bid) <= +formatEther(nextBid))
              }
              isPending={isPending}
              loading={isConfirming}
              isConfirmed={isConfirmed && !needsApproval}
            >
              {isConfirmed && !needsApproval
                ? "Close"
                : isConfirming
                ? needsApproval
                  ? "Approving"
                  : isTopUp
                    ? "Topping up Bid"
                    : "Placing Bid"
                : needsApproval
                  ? "Approve"
                  : isTopUp
                    ? "Top up bid"
                    : "Place bid"}
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
