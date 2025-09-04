import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/index";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Countdown from "react-countdown";
import { useResetAuctionsOnTrigger } from "@/components/auction/hooks/useResetAuctionsOnSuccess";
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
  auctionType,
  className,
}: {
  data: TAuctionData[];
  action?: TAuctionAction;
  id?: string;
  actionDelay?: number;
  disabled?: boolean;
  auctionType: "new" | "ongoing" | "past";
  className?: string;
}) => {
  const { isConnected } = useAccount();
  const shouldDelay = Boolean(actionDelay && actionDelay > Date.now() / 1000);
  const resetAuctionOnTrigger = useResetAuctionsOnTrigger();
  return (
    <Card
      className={`flex w-full max-w-[436px] flex-col gap-8 rounded-2xl p-[18px] max-md:mx-auto ${className ?? ""}`}
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
                onComplete={() => resetAuctionOnTrigger(auctionType)}
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
