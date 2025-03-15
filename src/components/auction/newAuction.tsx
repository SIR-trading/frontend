import React, { useEffect, useMemo } from "react";
import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { api } from "@/trpc/react";
import { TokenDisplay } from "@/components/ui/token-display";
import { useWriteContract } from "wagmi";
import { useStartAuction } from "@/components/auction/hooks/auctionSimulationHooks";
import { AUCTION_COOLDOWN } from "@/components/auction/__constants";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";

type TNewAuctionData = {
  amount: bigint;
  timeToStart: number;
  token: string;
};

// const currentTime = Date.now();
// Date.now = () => currentTime + 86_400_000;

const NewAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const { data: tokenWithFeesMap, refetch } =
    api.vault.getTotalCollateralFeesInVault.useQuery(
      Array.from(uniqueAuctionCollection.uniqueCollateralToken),
      {
        enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
      },
    );
  const { data: allExistingAuctions } = api.auction.getallAuctions.useQuery();

  const { writeContractAsync } = useWriteContract();
  const [id, setId] = React.useState<string>();
  const startAuctionRequest = useStartAuction({ id });

  const handleAuctionStart = (id: string) => {
    setId(id);
  };

  const { readyToStart, onHold } = useMemo(() => {
    const readyToStart = new Set<TNewAuctionData>();
    const onHold = new Set<TNewAuctionData>();
    const currentTime = Math.floor(Date.now() / 1000);

    allExistingAuctions?.forEach((auction) => {
      const amount = tokenWithFeesMap?.get(auction.token);

      if (amount && amount > BigInt(0)) {
        const newData: TNewAuctionData = {
          amount,
          timeToStart: +auction.startTime + AUCTION_COOLDOWN,
          token: auction.token,
        };

        if (newData.timeToStart > currentTime) {
          onHold.add(newData);
        } else {
          readyToStart.add(newData);
        }
      }
    });
    uniqueAuctionCollection.uniqueCollateralToken.forEach((token) => {
      if (
        allExistingAuctions &&
        !allExistingAuctions?.some((auction) => auction.token === token)
      ) {
        const amount = tokenWithFeesMap?.get(token);
        if (amount && amount > BigInt(0))
          readyToStart.add({
            amount,
            timeToStart: 0,
            token,
          });
      }
    });

    return {
      readyToStart: Array.from(readyToStart),
      onHold: Array.from(onHold),
    };
  }, [
    allExistingAuctions,
    tokenWithFeesMap,
    uniqueAuctionCollection.uniqueCollateralToken,
  ]);

  useEffect(() => {
    if (id && startAuctionRequest) {
      console.log("startAuctionRequest", { startAuctionRequest, id });
      writeContractAsync(startAuctionRequest)
        ?.then(async () => {
          setId(undefined);
          await refetch();
        })
        .catch((reason) => {
          console.log("startAuctionRequest error", reason);
        });
    }
  }, [id, refetch, startAuctionRequest, writeContractAsync]);

  return (
    <div>
      <AuctionContentWrapper header="Ready to Start">
        {readyToStart.map((auction, index) => (
          <AuctionCard
            data={[
              [
                {
                  title: AuctionCardTitle.AUCTION_DETAILS,
                  content: uniqueAuctionCollection.collateralSymbolMap.get(
                    auction.token,
                  ),
                  variant: "large",
                },
                {
                  title: AuctionCardTitle.AMOUNT,
                  content: (
                    <TokenDisplay
                      labelSize="small"
                      amountSize="large"
                      amount={auction.amount}
                      decimals={
                        uniqueAuctionCollection.collateralDecimalsMap.get(
                          auction.token,
                        ) ?? 18
                      }
                      unitLabel={
                        uniqueAuctionCollection.collateralSymbolMap.get(
                          auction.token,
                        ) ?? ""
                      }
                      className={
                        "font-lora text-[32px] font-normal leading-[32px]"
                      }
                    />
                  ),
                  variant: "large",
                },
              ],
            ]}
            action={{
              title: "Start Auction",
              onClick: () => {
                handleAuctionStart(auction.token);
              },
            }}
            actionDelay={auction.timeToStart}
            id={auction.token}
            key={index}
          />
        ))}
      </AuctionContentWrapper>
      <div className="h-[64px]" />
      <AuctionContentWrapper header="On Hold">
        {onHold.map((auction, index) => (
          <AuctionCard
            data={[
              [
                {
                  title: AuctionCardTitle.AUCTION_DETAILS,
                  content: uniqueAuctionCollection.collateralSymbolMap.get(
                    auction.token,
                  ),
                  variant: "large",
                },
                {
                  title: AuctionCardTitle.AMOUNT,
                  content: (
                    <TokenDisplay
                      labelSize="small"
                      amountSize="large"
                      amount={auction.amount}
                      decimals={
                        uniqueAuctionCollection.collateralDecimalsMap.get(
                          auction.token,
                        ) ?? 18
                      }
                      unitLabel={
                        uniqueAuctionCollection.collateralSymbolMap.get(
                          auction.token,
                        ) ?? ""
                      }
                      className={
                        "font-lora text-[32px] font-normal leading-[32px]"
                      }
                    />
                  ),
                  variant: "large",
                },
              ],
            ]}
            id={auction.token}
            key={index}
            action={{
              title: "Start Auction",
              onClick: () => {
                handleAuctionStart(auction.token);
              },
            }}
            actionDelay={auction.timeToStart}
          />
        ))}
      </AuctionContentWrapper>
    </div>
  );
};

export default NewAuction;
