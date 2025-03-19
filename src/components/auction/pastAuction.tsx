import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { TokenDisplay } from "@/components/ui/token-display";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useGetAuctionLot } from "@/components/auction/hooks/auctionSimulationHooks";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";
import { api } from "@/trpc/react";
import { compareAddress } from "@/lib/utils";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionModal from "@/components/shared/transactionModal";
import { useResetTransactionModal } from "@/components/leverage-liquidity/mintForm/hooks/useResetTransactionModal";
import useResetAuctionsOnSuccess from "@/components/auction/hooks/useResetAuctionsOnSuccess";

const PastAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const { address } = useAccount();

  const { data: auctions } = api.auction.getExpiredAuctions.useQuery(address);
  const { data: auctionLots } = api.auction.getAuctionBalances.useQuery(
    Array.from(uniqueAuctionCollection.uniqueCollateralToken),
    {
      enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
    },
  );

  const { writeContract, data: hash, isPending, reset } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });

  const { openTransactionModal, setOpenTransactionModal } =
    useResetTransactionModal({ reset, isConfirmed });

  const [id, setId] = useState<string>();
  const getAuctionLotRequest = useGetAuctionLot({ id, receiver: address });

  const handleGetAuctionLot = (id: string) => {
    setId(id);
    setOpenTransactionModal(true);
  };

  const confirmTransaction = () => {
    if (!isConfirmed) {
      if (id && getAuctionLotRequest) {
        writeContract(getAuctionLotRequest);
      }
    } else {
      setOpenTransactionModal(false);
    }
  };

  useResetAuctionsOnSuccess({
    isConfirming,
    isConfirmed,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
    actions: () => {
      setId(undefined);
      setOpenTransactionModal(false);
    },
    auctionType: "past",
  });

  return (
    <div>
      <TransactionModal.Root
        title="Claim Auction"
        open={openTransactionModal}
        setOpen={setOpenTransactionModal}
      >
        <TransactionModal.Close setOpen={setOpenTransactionModal} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          <div className="grid gap-4">
            <h4 className="text-lg font-bold">
              {isPending || isConfirming ? "Claiming" : "Claim"}{" "}
              <TokenDisplay
                amount={BigInt(auctionLots?.get(id ?? "") ?? "0")}
                labelSize="small"
                amountSize="large"
                decimals={
                  uniqueAuctionCollection.collateralDecimalsMap.get(id ?? "") ??
                  18
                }
                unitLabel={
                  uniqueAuctionCollection.collateralSymbolMap.get(id ?? "") ??
                  ""
                }
                className={"font-lora text-[28px] font-normal leading-[32px]"}
              />
            </h4>
            <TransactionStatus
              showLoading={isConfirming}
              waitForSign={isPending}
              action={""}
            />
          </div>
        </TransactionModal.InfoContainer>
        <TransactionModal.StatSubmitContainer>
          <TransactionModal.SubmitButton
            onClick={confirmTransaction}
            disabled={
              (!isConfirmed && !Boolean(id)) || isPending || isConfirming
            }
            isPending={isPending}
            loading={isConfirming}
            isConfirmed={isConfirmed}
          >
            {isConfirmed ? "Claimed" : "Claim"}
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
      <AuctionContentWrapper header={"Past auctions"}>
        {auctions?.map(
          ({ amount, highestBid, highestBidder, token, isParticipant }) => (
            <AuctionCard
              auctionType="past"
              data={[
                [
                  {
                    title: AuctionCardTitle.AUCTION_DETAILS,
                    content: (
                      <TokenDisplay
                        amount={BigInt(auctionLots?.get(token) ?? amount)}
                        labelSize="small"
                        amountSize="large"
                        decimals={
                          uniqueAuctionCollection.collateralDecimalsMap.get(
                            token,
                          ) ?? 18
                        }
                        unitLabel={
                          uniqueAuctionCollection.collateralSymbolMap.get(
                            token,
                          ) ?? ""
                        }
                        className={
                          "font-lora text-[28px] font-normal leading-[32px]"
                        }
                      />
                    ),
                  },
                ],
                [
                  {
                    title: AuctionCardTitle.YOUR_BID,
                    content: (
                      <TokenDisplay
                        amount={BigInt(isParticipant[0]?.bid ?? "0")}
                        labelSize="small"
                        amountSize="large"
                        decimals={18}
                        unitLabel={"ETH"}
                        className={"text-lg"}
                      />
                    ),
                  },
                  {
                    title: AuctionCardTitle.HIGHEST_BID,
                    content: (
                      <TokenDisplay
                        amount={BigInt(highestBid)}
                        labelSize="small"
                        amountSize="large"
                        decimals={18}
                        unitLabel={"ETH"}
                        className={"text-lg"}
                      />
                    ),
                  },
                ],
                [
                  {
                    title: AuctionCardTitle.CLOSING_TIME,
                    content: "Closed",
                  },
                  {
                    title: AuctionCardTitle.LEADER,
                    content: compareAddress(highestBidder, address)
                      ? "YOU ARE LEADING"
                      : "SOMEONE ELSE",
                    variant: "large",
                  },
                ],
              ]}
              key={token}
              action={
                compareAddress(highestBidder, address)
                  ? {
                      title: "Claim",
                      onClick: () => {
                        handleGetAuctionLot(token);
                      },
                    }
                  : undefined
              }
              id={token}
            />
          ),
        )}
      </AuctionContentWrapper>
    </div>
  );
};

export default PastAuction;
