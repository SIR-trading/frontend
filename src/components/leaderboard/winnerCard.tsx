import React from "react";
import { Card } from "@/components/ui/card";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";

interface WinnerCardProps {
  pnlLeader: {
    address: string;
    amount: number;
  } | null;
  percentageLeader: {
    address: string;
    percentage: number;
  } | null;
  isLoading: boolean;
}

const WinnerCard: React.FC<WinnerCardProps> = ({
  pnlLeader,
  percentageLeader,
  isLoading,
}) => {
  if (isLoading || (!pnlLeader && !percentageLeader)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 mb-4">
      {percentageLeader && (
        <Card className="flex-1 p-4 bg-gradient-to-r from-green-500/5 to-green-500/10 border-foreground/10 relative">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🎖️</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">% PnL Leader</p>
              <div className="flex items-center gap-2">
                <AddressExplorerLink
                  address={percentageLeader.address}
                  fontSize={14}
                  shortenLength={4}
                />
                <span className="text-accent-600 dark:text-accent-100 font-semibold">
                  <DisplayFormattedNumber num={percentageLeader.percentage} />%
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {pnlLeader && (
        <Card className="flex-1 p-4 bg-gradient-to-r from-yellow-500/5 to-yellow-500/10 border-foreground/10 relative">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">🏆</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">PnL Leader</p>
              <div className="flex items-center gap-2">
                <AddressExplorerLink
                  address={pnlLeader.address}
                  fontSize={14}
                  shortenLength={4}
                />
                <span className="text-accent-600 dark:text-accent-100 font-semibold">
                  <DisplayFormattedNumber num={pnlLeader.amount} /> USD
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WinnerCard;