import { Dialog, DialogContent } from "@/components/ui/dialog";
import TransactionModal from "@/components/shared/transactionModal";
import AuctionBidInputs from "./bid-inputs";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getLogoAsset } from "@/lib/assets";
import { formatEther, parseEther } from "viem";
import useAuctionTokenInfo from "@/components/auction/hooks/useAuctionTokenInfo";
import { useFormContext } from "react-hook-form";
import type { TAuctionBidFormFields } from "@/components/providers/auctionBidFormProvider";
import { useBid } from "@/components/auction/hooks/auctionSimulationHooks";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useResetAfterApprove } from "@/components/leverage-liquidity/mintForm/hooks/useResetAfterApprove";
import { useCallback, useMemo } from "react";
import { WETH_ADDRESS } from "@/data/constants";
import React from "react";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import ExplorerLink from "@/components/shared/explorerLink";
import useResetAuctionsOnSuccess from "@/components/auction/hooks/useResetAuctionsOnSuccess";

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
  const { id: tokenAddress, bid: currentBid, isTopUp } = open;

  const form = useFormContext<TAuctionBidFormFields>();

  const formData = form.watch();

  const { userBalance, userBalanceFetching, needsApproval, approveRequest } =
    useAuctionTokenInfo({
      tokenAddress: WETH_ADDRESS,
      amount: formData.bid,
      isOpen: open.open,
    });

  const { request: bidRequest, refetch: reSimulateBid } = useBid({
    token: tokenAddress,
    amount: formData.bid,
  });

  const balance = userBalance?.tokenBalance?.result;

  const nextBid = useMemo(
    () => ((currentBid ?? BigInt(0)) * BigInt(101)) / BigInt(100),
    [currentBid],
  );

  const { writeContract, reset, data: hash, isPending } = useWriteContract();
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
      writeContract(bidRequest);
      return;
    }
    setOpen({ open: false });
  }, [
    approveRequest,
    bidRequest,
    isConfirmed,
    needsApproval,
    setOpen,
    writeContract,
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
      setTimeout(() => {
        setOpen({ open: false });
        reset();
      }, 3000);
    },
  });

  return (
    <Dialog open={open.open} onOpenChange={(open) => setOpen({ open })}>
      <DialogContent title="Auction Bid Modal" className="bg-transparent">
        <div
          className={`nav-shadow relative rounded-xl bg-secondary p-4  text-white transition-all duration-700 `}
        >
          <TransactionModal.Close setOpen={(open) => setOpen({ open })} />
          <h1 className="text-center font-lora text-2xl">
            {isTopUp ? "Top up bid" : "Place bid"}{" "}
          </h1>
          <AuctionBidInputs.Root>
            <AuctionBidInputs.Inputs
              decimals={18}
              disabled={false}
              inputLoading={false}
              balance={formatEther(balance ?? BigInt(0))}
            >
              <ImageWithFallback
                src={getLogoAsset(WETH_ADDRESS)}
                alt="alt"
                width={25}
                height={25}
              />
              <p>WETH</p>
            </AuctionBidInputs.Inputs>
            <div className="h-6"></div>

            <TransactionStatus
              showLoading={isConfirming}
              waitForSign={isPending}
              action={""}
            />

            <ExplorerLink align="left" transactionHash={hash} />
          </AuctionBidInputs.Root>

          <TransactionModal.StatSubmitContainer>
            <TransactionModal.SubmitButton
              onClick={onSubmit}
              disabled={
                userBalanceFetching ||
                (Number(formData.bid) === 0 && !isConfirmed) ||
                (!balance && !isConfirmed) ||
                (parseEther(formData.bid) > balance! && !isConfirmed) ||
                (!isConfirmed && isTopUp
                  ? Number(formData.bid) <=
                    +formatEther(nextBid - (currentBid ?? BigInt(0)))
                  : Number(formData.bid) <= +formatEther(nextBid)) // TODO: Add proper error message to show user that minimum bid must be 1% higher than the current bid
              }
              isPending={isPending}
              loading={isConfirming}
              isConfirmed={isConfirmed}
            >
              {isConfirming
                ? needsApproval
                  ? "Approving"
                  : isTopUp
                    ? "Topping up Bid"
                    : "Placing Bid"
                : needsApproval
                  ? "Approve"
                  : isTopUp
                    ? "Top up Bid"
                    : "Place Bid"}
            </TransactionModal.SubmitButton>
          </TransactionModal.StatSubmitContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
