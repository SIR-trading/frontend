import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import type { TAuctions, TVaultsCollateralToken } from "@/lib/types";
import { TokenDisplay } from "@/components/ui/token-display";
import Countdown from "react-countdown";
import { AUCTION_DURATION } from "@/components/auction/__constants";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import type { TAuctionBidModalState } from "@/components/auction/AuctionBidModal";
import { AuctionBidModal } from "@/components/auction/AuctionBidModal";
import AuctionBidFormProvider from "@/components/providers/auctionBidFormProvider";

const OngoingAuction = ({
  auctions,
  tokensForAuctions,
  refetch,
}: {
  auctions?: TAuctions[];
  tokensForAuctions: TVaultsCollateralToken;
  refetch: () => void;
}) => {
  const [openModal, setOpenModal] = useState<TAuctionBidModalState>({
    open: false,
  });
  const { address } = useAccount();

  useEffect(() => {
    if (!openModal.open) {
      refetch();
    }
  }, [openModal.open, refetch]);

  return (
    <div>
      <AuctionBidFormProvider>
        <AuctionBidModal open={openModal} setOpen={setOpenModal} />
      </AuctionBidFormProvider>

      <AuctionContentWrapper header={"Ongoing auctions you’re Part of"}>
        {auctions?.map(({ bidder, bid, tokenIndex, startTime }) => (
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
                  content: (
                    <Countdown date={(startTime + AUCTION_DURATION) * 1000} />
                  ),
                },
                {
                  title: AuctionCardTitle.LEADER,
                  content:
                    bidder === address ? "YOU ARE LEADING" : "SOMEONE ELSE",
                  variant: "large",
                },
              ],
            ]}
            id={tokensForAuctions.collateralToken[tokenIndex]}
            key={tokenIndex}
            action={{
              title: bidder === address ? "Top up" : "Bid",
              onClick: (id) => {
                setOpenModal({
                  open: true,
                  id,
                  bid,
                  isTopUp: bidder === address,
                });
              },
            }}
          />
        ))}
      </AuctionContentWrapper>
      <div className="h-[64px]" />
      <AuctionContentWrapper header={"Other ongoing auctions"}>
        {[1, 2].map((item, index) => (
          <AuctionCard
            data={[
              [
                {
                  title: AuctionCardTitle.AUCTION_DETAILS,
                  content: "XXXX / XXXX",
                  variant: "large",
                },
              ],
              [
                {
                  title: AuctionCardTitle.YOUR_BID,
                  content: "XXX ETH",
                },
                {
                  title: AuctionCardTitle.CLOSING_TIME,
                  content: "DD:HH:MM:SS",
                },
              ],
            ]}
            key={index}
          />
        ))}
      </AuctionContentWrapper>
    </div>
  );
};

export default OngoingAuction;
