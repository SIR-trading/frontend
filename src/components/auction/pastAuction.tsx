import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { TokenDisplay } from "@/components/ui/token-display";
import { useAccount } from "wagmi";
import { useGetAuctionLot } from "@/components/auction/hooks/auctionSimulationHooks";
import { useState, useEffect } from "react";
import { useWriteContract } from "wagmi";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";
import { api } from "@/trpc/react";
import { compareAddress } from "@/lib/utils";

const PastAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const { address } = useAccount();

  const { writeContractAsync } = useWriteContract();

  const [id, setId] = useState<string>();
  const getAuctionLotRequest = useGetAuctionLot({ id, receiver: address });
  const { data: auctions } = api.auction.getExpiredAuctions.useQuery(address);
  const { data: auctionLots } = api.auction.getAuctionBalances.useQuery(
    Array.from(uniqueAuctionCollection.uniqueCollateralToken),
    {
      enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
    },
  );

  const handleGetAuctionLot = (id?: string) => {
    setId(id);
  };

  useEffect(() => {
    if (id && getAuctionLotRequest) {
      console.log("getAuctionLotRequest", { getAuctionLotRequest, id });
      writeContractAsync(getAuctionLotRequest)
        ?.then(async () => {
          setId(undefined);
        })
        .catch((reason) => {
          console.log("getAuctionLotRequest error", reason);
        });
    }
  }, [id, , getAuctionLotRequest, writeContractAsync]);

  return (
    <div>
      <AuctionContentWrapper header={"Past auctions"}>
        {auctions?.map(
          ({ amount, highestBid, highestBidder, token, isParticipant }) => (
            <AuctionCard
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
                      onClick: (id) => {
                        handleGetAuctionLot(id);
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
