import { roundDown } from "@/lib/utils/index";
import { useMemo } from "react";
export function BidPercent({
  setValue,
  disabled,
  settings,
  currentBid,
  nextBid,
  isTopUp = false,
}: {
  setValue: (s: string) => void;
  balance: string | undefined;
  disabled?: boolean;
  settings?: React.ReactNode;
  currentBid: string;
  nextBid: string;
  isTopUp?: boolean;
}) {
  const minBid = useMemo(
    () =>
      (isTopUp
        ? parseFloat(nextBid) - parseFloat(currentBid)
        : parseFloat(nextBid)) + 0.0001,
    [currentBid, isTopUp, nextBid],
  );

  // Calculate amounts based on current bid for +50% and 2x
  const currentBidAmount = parseFloat(currentBid);

  const fiftyPercentBid = useMemo(() => {
    if (isTopUp) {
      // For top-up: 50% of current bid as the top-up amount
      return currentBidAmount * 0.5;
    } else {
      // For new bid: 150% of current bid
      return currentBidAmount * 1.5;
    }
  }, [currentBidAmount, isTopUp]);

  const doubleBid = useMemo(() => {
    if (isTopUp) {
      // For top-up: 100% of current bid as the top-up amount (doubling the total)
      return currentBidAmount;
    } else {
      // For new bid: 200% of current bid
      return currentBidAmount * 2;
    }
  }, [currentBidAmount, isTopUp]);

  return (
    <h2 className="flex justify-end gap-x-2 pt-1 text-right font-geist text-sm">
      {settings}
      <button
        onClick={() => setValue(roundDown(minBid, 6).toString())}
        aria-label="Min Bid"
        type="button"
        disabled={disabled}
        className="hover:underline"
      >
        Min
      </button>{" "}
      <button
        disabled={disabled}
        onClick={() => setValue(roundDown(fiftyPercentBid, 6).toString())}
        aria-label="50% more than Current Bid"
        type="button"
        className="hover:underline"
      >
        +50%
      </button>{" "}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setValue(roundDown(doubleBid, 6).toString());
        }}
        aria-label="Double Current Bid"
        className="hover:underline"
      >
        2x
      </button>
    </h2>
  );
}
