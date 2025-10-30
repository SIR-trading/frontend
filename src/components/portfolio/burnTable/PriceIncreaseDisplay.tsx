import React from "react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

export function PriceIncreaseDisplay({
  percentage,
  className = ""
}: {
  percentage: number | null;
  className?: string;
}) {
  if (percentage === null) return <span>—</span>;
  if (percentage <= 0) return <span className={className}>✓</span>;

  return (
    <span className={className}>
      <DisplayFormattedNumber num={percentage} significant={2} />%
    </span>
  );
}