import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import type { TAuctions, TVaultsCollateralToken } from "@/lib/types";
import { TokenDisplay } from "@/components/ui/token-display";
import { useAccount } from "wagmi";
import { useGetAuctionLot } from "@/components/auction/hooks/auctionSimulationHooks";
import { useState, useEffect } from "react";
import { useWriteContract } from "wagmi";

const PastAuction = ({
  auctions,
  tokensForAuctions,
}: {
  auctions?: TAuctions[];
  tokensForAuctions: TVaultsCollateralToken;
}) => {
  const { address } = useAccount();

  const { writeContractAsync } = useWriteContract();

  const [id, setId] = useState<string>();
  const getAuctionLotRequest = useGetAuctionLot({ id, receiver: address });

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
          ({ bidder, bid, tokenIndex }) =>
            bid > 0n && (
              <AuctionCard
                data={[
                  [
                    {
                      title: AuctionCardTitle.AUCTION_DETAILS,
                      content: tokensForAuctions.collateralSymbol[tokenIndex],
                      variant: "large",
                    },
                  ],
                  [
                    {
                      title: AuctionCardTitle.YOUR_BID,
                      content: "XXX ETH",
                    },
                    {
                      title: AuctionCardTitle.HIGHEST_BID,
                      content: (
                        <TokenDisplay
                          amount={bid}
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
                      content: bidder === address ? "YOU WON" : "YOU LOST",
                      variant: "large",
                    },
                  ],
                ]}
                action={
                  bidder === address
                    ? {
                        title: "Claim",
                        onClick: (id) => {
                          handleGetAuctionLot(id);
                        },
                      }
                    : undefined
                }
                id={tokensForAuctions.collateralToken[tokenIndex]}
                key={tokenIndex}
              />
            ),
        )}
      </AuctionContentWrapper>
    </div>
  );
};

export default PastAuction;
