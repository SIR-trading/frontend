import React from "react";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";

interface TimeDisplayProps {
  days: number | null;
  className?: string;
}

export function TimeDisplay({ days, className = "" }: TimeDisplayProps) {
  if (days === null) return <span className={className}>—</span>;
  if (days === 0) return <span className={className}>✓</span>;

  // If infinity or >= 1000 years, show infinity symbol
  if (!isFinite(days) || days / 365 >= 1000) {
    return <span className="relative top-1 text-lg leading-none">∞</span>;
  }

  // Convert days to appropriate unit
  let value: number;
  let unit: string;

  if (days < 30) {
    value = days;
    unit = "d";
  } else if (days < 365) {
    value = days / 30;
    unit = "m";
  } else {
    value = days / 365;
    unit = "y";
  }

  return (
    <span className={className}>
      <DisplayFormattedNumber num={value} significant={2} />
      {unit}
    </span>
  );
}
