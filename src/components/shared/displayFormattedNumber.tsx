import { useMemo } from "react";
import type React from "react";
import { formatNumber } from "@/lib/utils";

type DisplayProps = {
  num: number | string | bigint;
  significant?: number;
};

export default function DisplayFormattedNumber({ num, significant = 3 }: DisplayProps) {
  const formattedData = useMemo(() => {
    // Call formatNumber internally
    const formatted = formatNumber(num, significant);
    
    // Handle SmallNumberFormat object
    if (typeof formatted === "object" && formatted.type === 'small') {
      return (
        <>
          {formatted.sign}0.0<sub>{formatted.zeroCount}</sub>{formatted.sigDigits}
        </>
      );
    }
    
    // For regular strings, return as-is
    return formatted;
  }, [num, significant]);

  return <>{formattedData}</>;
}
