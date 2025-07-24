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
import { compareAddress } from "@/lib/utils/index";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import TransactionModal from "@/components/shared/transactionModal";
import { useResetTransactionModal } from "@/components/leverage-liquidity/mintForm/hooks/useResetTransactionModal";
import useResetAuctionsOnSuccess from "@/components/auction/hooks/useResetAuctionsOnSuccess";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import Show from "@/components/shared/show";
import AuctionContentSkeleton from "@/components/auction/AuctionContentSkeleton";
import type { Address } from "viem";
import { hexToBigInt } from "viem";
import Pagination from "@/components/shared/pagination";

const length = 10; // Number of auctions per page

const PastAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const { address } = useAccount();
  const [page, setPage] = useState(1);

  const { data: allAuctions } = api.auction.getExpiredAuctions.useQuery({
    user: address,
  });

  const { data: auctions, isPending: isLoading } =
    api.auction.getExpiredAuctions.useQuery({
      user: address,
      skip: (page - 1) * length,
      first: length,
    });
  const { data: auctionLots, isPending: isLoadingBal } =
    api.auction.getAuctionBalances.useQuery(
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

  const nextPage = () => {
    const currentLength = auctions?.length;

    if (length === currentLength && allAuctions) {
      if (allAuctions?.[length - 1]?.id) {
        setPage((page) => page + 1);
      }
    }
  };
  const prevPage = () => {
    if (page > 1) {
      if (page - 1 === 1) {
        setPage(1);
      } else {
        setPage(page - 1);
      }
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
                className={"font-geist text-[24px] font-normal leading-[32px]"}
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
      <Show
        when={!isLoading && !isLoadingBal}
        fallback={<AuctionContentSkeleton />}
      >
        {auctions && auctions.length > 0 ? (
          <>
            <AuctionContentWrapper>
              {auctions?.map(
                ({
                  amount,
                  highestBid,
                  highestBidder,
                  token,
                  isParticipant,
                  isClaimed,
                }) => (
                  <AuctionCard
                    auctionType="past"
                    data={[
                      [
                        {
                          title: AuctionCardTitle.AUCTION_DETAILS,
                          content: (
                            <AddressExplorerLink
                              address={token}
                              fontSize={20}
                              shortenLength={4}
                            />
                          ),
                        },
                        {
                          title: AuctionCardTitle.AMOUNT,
                          content: (
                            <TokenDisplay
                              amount={
                                (auctionLots?.get(token) ?? 0n) > 0n
                                  ? auctionLots?.get(token)
                                  : BigInt(amount)
                              }
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
                                "font-geist text-[24px] font-normal leading-[32px]"
                              }
                            />
                          ),
                          variant: "large",
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
                          title: AuctionCardTitle.Winner,
                          content: compareAddress(highestBidder, address) ? (
                            "YOU WON"
                          ) : hexToBigInt(highestBidder as Address) ===
                            BigInt(0) ? (
                            "N/A"
                          ) : (
                            <AddressExplorerLink address={highestBidder} />
                          ),
                        },
                      ],
                    ]}
                    key={token}
                    action={
                      compareAddress(highestBidder, address)
                        ? {
                            title: isClaimed ? "Claimed" : "Claim",
                            onClick: () => {
                              handleGetAuctionLot(token);
                            },
                          }
                        : undefined
                    }
                    disabled={isClaimed}
                    id={token}
                  />
                ),
              )}
            </AuctionContentWrapper>{" "}
            <div className="pr-4">
              <Pagination
                max={auctions.length}
                page={page}
                nextPage={nextPage}
                prevPage={prevPage}
                length={length}
                size="lg"
              />
            </div>
          </>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-lg">No Auctions available</p>
          </div>
        )}
      </Show>
    </div>
  );
};

export default PastAuction;
