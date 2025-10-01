import { useMemo } from "react";
import type React from "react";
import { formatNumber } from "@/lib/utils";

/**
 * DisplayFormattedNumber Component
 *
 * A React component that displays numbers with intelligent formatting:
 * - Large numbers: Uses comma separators (e.g., 1,234,567)
 * - Small numbers (< 0.001): Uses subscript notation (e.g., 0.0₃456)
 * - Regular decimals: Shows specified significant digits
 * - Handles bigint, string, and number inputs
 *
 * @component
 * @example
 * // Display with default 3 significant digits
 * <DisplayFormattedNumber num={1234.567} />
 * // Output: 1,230
 *
 * @example
 * // Display very small number with subscript
 * <DisplayFormattedNumber num={0.000456} significant={3} />
 * // Output: 0.0₃456
 *
 * @example
 * // Display with custom significant digits
 * <DisplayFormattedNumber num="123456.789" significant={5} />
 * // Output: 123,460
 */
type DisplayProps = {
  /** The number to format - can be number, string, or bigint */
  num: number | string | bigint;
  /** Number of significant digits to display (default: 3) */
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
