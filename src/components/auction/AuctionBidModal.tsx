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
import { useCallback, useEffect } from "react";
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

  const [isApproved, setIsApproved] = React.useState(false);

  const balance = userBalance?.tokenBalance?.result;

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

    if (bidRequest) {
      writeContract(bidRequest);
      return;
    }
  }, [approveRequest, bidRequest, needsApproval, writeContract]);

  useResetAfterApprove({
    isConfirmed,
    reset: () => {
      setIsApproved(true);
      reset();
      reSimulateBid()
        .then((r) => r)
        .catch((e) => console.log(e));
    },
    needsApproval,
  });

  useResetAuctionsOnSuccess({
    isConfirming: isConfirming,
    isConfirmed: isConfirmed,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
    auctionType: "ongoing",
    halt: !isApproved,
    actions: () => {
      if (!isApproved) {
        return;
      } else {
        form.reset();
        setIsApproved(false);
        setOpen({ open: false });
        setTimeout(() => {
          reset();
        }, 2000);
      }
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
                Number(formData.bid) === 0 ||
                !balance ||
                parseEther(formData.bid) > balance ||
                (!isTopUp &&
                  formData.bid <= formatEther(currentBid ?? BigInt(0)))
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

        {/* {openTransactionModal && (
          <div
            className={`nav-shadow relative rounded-xl bg-secondary p-4  text-white transition-all duration-700 `}
          >
            
              <div className="grid gap-4">
                <h4 className="text-lg font-bold">
                  {isPending || isConfirming ?  : "Place"} bid{" "}
                  
                  <TokenDisplay
                    amount={parseEther(formData.bid)}
                    labelSize="small"
                    amountSize="large"
                    decimals={18}
                    unitLabel={"WETH"}
                    className={
                      "font-lora text-[28px] font-normal leading-[32px]"
                    }
                  />
                </h4>
              
                {isConfirming && (
        <div className="">
         
        </div>
      )}
              </div>
            <TransactionModal.StatSubmitContainer>
              <TransactionModal.SubmitButton
                onClick={onSubmit}
                disabled={isPending || isConfirming}
                isPending={isPending}
                loading={isConfirming}
                isConfirmed={isConfirmed}
              >
                {isConfirming ? "Confirming" : "Confirm"}
              </TransactionModal.SubmitButton>
            </TransactionModal.StatSubmitContainer>
          </div>
        )} */}
      </DialogContent>
    </Dialog>
  );
}
