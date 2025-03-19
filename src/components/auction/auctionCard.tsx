import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Countdown from "react-countdown";
import { useResetAuctionsOnTrigger } from "@/components/auction/hooks/useResetAuctionsOnSuccess";

export enum AuctionCardTitle {
  AUCTION_DETAILS = "Auction details",
  YOUR_BID = "Your bid",
  HIGHEST_BID = "Highest bid",
  CLOSING_TIME = "Closing time",
  LEADER = "Leader",
  AMOUNT = "Amount",
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
}: {
  data: TAuctionData[];
  action?: TAuctionAction;
  id?: string;
  actionDelay?: number;
  disabled?: boolean;
  auctionType: "new" | "ongoing" | "past";
}) => {
  const shouldDelay = Boolean(actionDelay && actionDelay > Date.now() / 1000);
  const resetAuctionOnTrigger = useResetAuctionsOnTrigger();
  return (
    <Card className="flex w-full max-w-[436px] flex-col gap-8 rounded-2xl p-[18px] max-md:mx-auto">
      {data.map((item, index) => (
        <div key={index} className="grid grid-cols-2 gap-6">
          {item.map((subItem, subIndex) => (
            <div key={subIndex}>
              <p className="mb-2 text-sm">{subItem.title}</p>
              <div
                className={cn(
                  subItem.variant
                    ? "font-lora text-[28px] font-normal leading-[32px]"
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
          disabled={shouldDelay || disabled}
        >
          {shouldDelay ? (
            <div className="flex items-center justify-center gap-1">
              <>Starting in</>{" "}
              <Countdown
                date={actionDelay! * 1000}
                onComplete={() => resetAuctionOnTrigger(auctionType)}
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
