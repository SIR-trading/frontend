import React, { useEffect } from "react";
import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { api } from "@/trpc/react";
import type { TAuctions, TVaultsCollateralToken } from "@/lib/types";
import { TokenDisplay } from "@/components/ui/token-display";
import { useWriteContract } from "wagmi";
import { useStartAuction } from "@/components/auction/hooks/auctionSimulationHooks";
import { AUCTION_COOLDOWN } from "@/components/auction/__constants";

type TAuctionData = {
  collateralSymbol: string | undefined;
  collateralToken: string;
  apeDecimals: number | undefined;
  startTime: number;
  fees: bigint;
}[];

// const currentTime = Date.now();
// Date.now = () => currentTime + 86_400_000;

const NewAuction = ({
  tokensForAuctions,
  ongoingAuctions,
  pastAuctions,
}: {
  tokensForAuctions: TVaultsCollateralToken;
  ongoingAuctions: TAuctions[] | undefined;
  pastAuctions: TAuctions[] | undefined;
}) => {
  const { data: tokenFeesInVault, refetch } =
    api.vault.getTotalCollateralFeesInVault.useQuery(
      tokensForAuctions.collateralToken,
      {
        enabled: tokensForAuctions.collateralSymbol.length > 0,
      },
    );
  const { writeContractAsync } = useWriteContract();
  const [id, setId] = React.useState<string>();
  const startAuctionRequest = useStartAuction({ id });

  const handleAuctionStart = (id: string) => {
    setId(id);
  };

  const newAuctionData = tokensForAuctions.collateralToken.reduce<
    Record<"readyToStart" | "onHold", TAuctionData>
  >(
    (acc, token, index) => {
      const fees = tokenFeesInVault?.[index] ?? BigInt(0n);
      if (fees <= BigInt(0n)) {
        return acc;
      }
      const _auctions =
        ongoingAuctions?.find(
          (auction) =>
            token === tokensForAuctions.collateralToken[auction.tokenIndex],
        ) ?? pastAuctions?.find((auction) => auction.tokenIndex === index);
      const updateData = (key: keyof typeof acc) => {
        acc[key].push({
          collateralSymbol: tokensForAuctions.collateralSymbol[index],
          collateralToken: token,
          apeDecimals: tokensForAuctions.apeDecimals[index],
          startTime: _auctions ? _auctions?.startTime + AUCTION_COOLDOWN : 0,
          fees,
        });
      };

      if (!_auctions) {
        updateData("readyToStart");
      } else {
        if (
          _auctions.startTime + AUCTION_COOLDOWN >
          Math.floor(Date.now() / 1000)
        ) {
          updateData("onHold");
        } else {
          updateData("readyToStart");
        }
      }

      return acc;
    },
    {
      readyToStart: [],
      onHold: [],
    },
  );

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
      {Object.entries(newAuctionData).map(([key, data]) => (
        <>
          <AuctionContentWrapper
            header={key === "readyToStart" ? "Ready to Start" : "On Hold"}
            key={key}
          >
            {data.map((auction, index) => (
              <AuctionCard
                data={[
                  [
                    {
                      title: AuctionCardTitle.AUCTION_DETAILS,
                      content: auction.collateralSymbol,
                      variant: "large",
                    },
                    {
                      title: AuctionCardTitle.AMOUNT,
                      content: (
                        <TokenDisplay
                          labelSize="small"
                          amountSize="large"
                          amount={auction.fees}
                          decimals={auction.apeDecimals}
                          unitLabel={auction.collateralSymbol ?? ""}
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
                    handleAuctionStart(auction.collateralToken);
                  },
                }}
                actionDelay={auction.startTime}
                id={auction.collateralToken}
                key={index}
              />
            ))}
          </AuctionContentWrapper>
          <div className="h-[64px]" />
        </>
      ))}
    </div>
  );
};

export default NewAuction;
