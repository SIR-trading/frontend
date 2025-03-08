import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

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

const AuctionCard = ({
  data,
  action,
  id,
}: {
  data: TAuctionData[];
  action?: TAuctionAction;
  id?: string;
}) => {
  return (
    <Card className="flex flex-col gap-8 rounded-2xl">
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
          className="w-full md:w-full"
          onClick={() => action.onClick(id)}
        >
          {action.title}
        </Button>
      )}
    </Card>
  );
};

export default AuctionCard;
