import { roundDown } from "@/lib/utils";
import { useMemo } from "react";
export function BidPercent({
  setValue,
  balance,
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

  console.log("minBid", minBid);
  //   +50% 2x

  return (
    <h2 className="flex justify-end gap-x-2 pt-1 text-right text-sm ">
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
        onClick={() => setValue(roundDown(minBid * 1.5, 6).toString())}
        aria-label="50% of Current Bid"
        type="button"
        className="hover:underline"
      >
        +50%
      </button>{" "}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setValue(roundDown(minBid * 2, 6).toString());
        }}
        aria-label="200% of Current Bid"
        className="hover:underline"
      >
        2x
      </button>
    </h2>
  );
}
