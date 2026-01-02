import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/index";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Countdown from "react-countdown";
import { useAccount } from "wagmi";

export enum AuctionCardTitle {
  AUCTION_DETAILS = "Token Address",
  YOUR_BID = "Your bid",
  HIGHEST_BID = "Highest bid",
  CLOSING_TIME = "Closing time",
  LEADER = "Leader",
  Winner = "Winner",
  AMOUNT = "Amount",
  // Alternative labels for past auctions
  TOKEN = "Token",
  ENDED = "Ended",
  WINNING_BID = "Winning Bid",
  // Alternative label for active auctions
  CLOSES_IN = "Closes in",
}

interface TAuctionDataContent {
  title: AuctionCardTitle;
  content: ReactNode;
  variant?: "large";
}

type TAuctionData = TAuctionDataContent[];

type TAuctionAction = {
  title: string;
  onClick: (id?: string) => void;
};

// const currentTime = Date.now();
// Date.now = () => currentTime + 86_400_000;

const AuctionCard = ({
  data,
  action,
  id,
  actionDelay,
  disabled,
  className,
  isPulsing,
  onCountdownComplete,
}: {
  data: TAuctionData[];
  action?: TAuctionAction;
  id?: string;
  actionDelay?: number;
  disabled?: boolean;
  className?: string;
  isPulsing?: boolean;
  onCountdownComplete?: () => void;
}) => {
  const { isConnected } = useAccount();
  const shouldDelay = Boolean(actionDelay && actionDelay > Date.now() / 1000);
  return (
    <Card
      className={cn(
        "flex w-full max-w-[436px] flex-col gap-6 rounded-2xl p-[18px] max-md:mx-auto",
        isPulsing && "auction-card-pulse",
        className
      )}
    >
      {data.map((item, index) => (
        <div key={index} className="grid grid-cols-2 gap-6">
          {item.map((subItem, subIndex) => (
            <div key={subIndex}>
              <p className="mb-2 font-geist text-sm text-muted-foreground">{subItem.title}</p>
              <div
                className={cn(
                  subItem.variant
                    ? "font-geist text-[24px] font-normal leading-[32px]"
                    : "text-lg",
                  isPulsing &&
                  (subItem.title === AuctionCardTitle.HIGHEST_BID ||
                   subItem.title === AuctionCardTitle.LEADER) &&
                  "auction-gold-glow",
                )}
              >
                {subItem.content}
              </div>
            </div>
          ))}
        </div>
      ))}
      {action && (
        <Button
          variant="submit"
          className={cn(
            "w-full md:w-full",
            shouldDelay && "bg-[#414158] text-white !opacity-100",
          )}
          onClick={() => action.onClick(id)}
          disabled={!isConnected || shouldDelay || disabled}
        >
          {shouldDelay ? (
            <div className="flex items-center justify-center gap-1">
              <>Starting in</>{" "}
              <Countdown
                date={actionDelay! * 1000}
                onComplete={onCountdownComplete}
                className="w-[120px] text-left"
              />
            </div>
          ) : (
            action.title
          )}
        </Button>
      )}
    </Card>
  );
};

export default AuctionCard;
