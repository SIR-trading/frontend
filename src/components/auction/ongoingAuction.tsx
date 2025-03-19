import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { useAccount } from "wagmi";
import { useCallback, useMemo, useState } from "react";
import type { TAuctionBidModalState } from "@/components/auction/AuctionBidModal";
import { AuctionBidModal } from "@/components/auction/AuctionBidModal";
import AuctionBidFormProvider from "@/components/providers/auctionBidFormProvider";
import { api } from "@/trpc/react";
import type { AuctionFieldFragment } from "@/lib/types";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";
import { TokenDisplay } from "@/components/ui/token-display";
import { AUCTION_DURATION } from "@/components/auction/__constants";
import Countdown from "react-countdown";
import { compareAddress } from "@/lib/utils";
import { useResetAuctionsOnTrigger } from "@/components/auction/hooks/useResetAuctionsOnSuccess";

const OngoingAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const [openModal, setOpenModal] = useState<TAuctionBidModalState>({
    open: false,
  });
  const { address } = useAccount();

  const { data: auctions } = api.auction.getOngoingAuctions.useQuery(address, {
    refetchInterval: 60 * 1000,
  });
  const { data: auctionLots } = api.auction.getAuctionBalances.useQuery(
    Array.from(uniqueAuctionCollection.uniqueCollateralToken),
    {
      enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
      refetchInterval: 60 * 1000,
    },
  );

  const [isTriggered, setIsTriggered] = useState(false);
  const resetAuctionOnTrigger = useResetAuctionsOnTrigger();

  const { userAuction, otherAuction } = useMemo(() => {
    const initial: {
      userAuction: AuctionFieldFragment[];
      otherAuction: AuctionFieldFragment[];
    } = { userAuction: [], otherAuction: [] };
    if (!auctions) {
      return initial;
    }
    return auctions.reduce((acc, auction) => {
      if (Boolean(auction.isParticipant.length)) {
        acc.userAuction.push(auction);
      } else {
        acc.otherAuction.push(auction);
      }
      return acc;
    }, initial);
  }, [auctions]);

  const handleTrigger = useCallback(() => {
    if (isTriggered) {
      return;
    }
    setIsTriggered(true);
    resetAuctionOnTrigger("ongoing");

    return () => {
      setIsTriggered(false);
    };
  }, [isTriggered, resetAuctionOnTrigger]);

  // useEffect(() => {
  //   if (!openModal.open) {
  //     refetch();
  //   }
  // }, [openModal.open, refetch]);

  return (
    <div>
      <AuctionBidFormProvider>
        <AuctionBidModal open={openModal} setOpen={setOpenModal} />
      </AuctionBidFormProvider>

      <AuctionContentWrapper header={"Ongoing auctions you’re Part of"}>
        {userAuction.map(
          ({
            startTime,
            highestBid,
            highestBidder,
            token,
            amount,
            isParticipant,
          }) => (
            <AuctionCard
              auctionType="ongoing"
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
                    content: (
                      <Countdown
                        date={(+startTime + AUCTION_DURATION) * 1000}
                        onComplete={handleTrigger}
                      />
                    ),
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
              id={token}
              key={token}
              action={{
                title: compareAddress(highestBidder, address)
                  ? "Top up"
                  : "Bid",
                onClick: (id) => {
                  setOpenModal({
                    open: true,
                    id,
                    bid: BigInt(highestBid),
                    isTopUp: compareAddress(highestBidder, address),
                  });
                },
              }}
            />
          ),
        )}
      </AuctionContentWrapper>
      <div className="h-[64px]" />
      <AuctionContentWrapper header={"Other ongoing auctions"}>
        {otherAuction.map(({ startTime, highestBid, token, amount }) => (
          <AuctionCard
            auctionType="ongoing"
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
                {
                  title: AuctionCardTitle.CLOSING_TIME,
                  content: (
                    <Countdown date={(+startTime + AUCTION_DURATION) * 1000} />
                  ),
                },
              ],
            ]}
            key={token}
            id={token}
            action={{
              title: "Bid",
              onClick: (id) => {
                setOpenModal({
                  open: true,
                  id,
                  bid: BigInt(highestBid),
                });
              },
            }}
          />
        ))}
      </AuctionContentWrapper>
    </div>
  );
};

export default OngoingAuction;
