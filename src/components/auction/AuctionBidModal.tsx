import { Dialog, DialogContent } from "@/components/ui/dialog";
import TransactionModal from "@/components/shared/transactionModal";
import AuctionBidInputs from "./bid-inputs";
import ImageWithFallback from "@/components/shared/ImageWithFallback";
import { getLogoAsset } from "@/lib/assets";
import { formatUnits, parseUnits } from "viem";
import useAuctionTokenInfo from "@/components/auction/hooks/useAuctionTokenInfo";
import { useFormContext } from "react-hook-form";
import type { TAuctionBidFormFields } from "@/components/providers/auctionBidFormProvider";
import { Button } from "@/components/ui/button";
import { useBid } from "@/components/auction/hooks/auctionSimulationHooks";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useResetAfterApprove } from "@/components/leverage-liquidity/mintForm/hooks/useResetAfterApprove";
import { useCallback } from "react";
import { WETH_ADDRESS } from "@/data/constants";

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

  const {
    userBalance,
    tokenDecimals,
    userBalanceFetching,
    needsApproval,
    approveRequest,
  } = useAuctionTokenInfo({
    tokenAddress: WETH_ADDRESS,
    amount: formData.bid,
    isOpen: open.open,
  });

  const { request: bidRequest, refetch: reSimulateBid } = useBid({
    token: tokenAddress,
    amount: formData.bid,
    tokenDecimals,
  });
  console.log({ bidRequest, approveRequest });

  const balance = userBalance?.tokenBalance?.result;

  const { writeContractAsync, reset, data: hash } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });

  const onSubmit = useCallback(async () => {
    if (approveRequest && needsApproval) {
      await writeContractAsync(approveRequest);
      await reSimulateBid();
    }

    if (bidRequest) {
      writeContractAsync(bidRequest)
        .then(() => {
          setOpen({ open: false });
          form.reset();
        })
        .catch((e) => {
          console.log(e);
        });
    }
  }, [
    approveRequest,
    bidRequest,
    form,
    needsApproval,
    reSimulateBid,
    setOpen,
    writeContractAsync,
  ]);

  useResetAfterApprove({
    isConfirmed,
    reset,
    needsApproval,
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
              decimals={tokenDecimals ?? 18}
              disabled={false}
              inputLoading={false}
              balance={formatUnits(balance ?? 0n, tokenDecimals ?? 18)}
            >
              <ImageWithFallback
                src={getLogoAsset(WETH_ADDRESS)}
                alt="alt"
                width={25}
                height={25}
              />
              <p>WETH</p>
            </AuctionBidInputs.Inputs>
          </AuctionBidInputs.Root>
          <Button
            onClick={onSubmit}
            disabled={
              userBalanceFetching ||
              !formData.bid ||
              !balance ||
              parseUnits(formData.bid, tokenDecimals ?? 18) > balance ||
              (!isTopUp &&
                formData.bid <=
                  formatUnits(currentBid ?? BigInt(0), tokenDecimals ?? 18))
            }
            variant="submit"
            className="mt-4 w-full md:w-full"
          >
            {" "}
            {needsApproval ? "Approve" : isTopUp ? "Top up Bid" : "Place Bid"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
