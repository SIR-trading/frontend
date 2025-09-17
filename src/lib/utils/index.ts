import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";
import type { TAddressString } from "../types";
import numeral from "numeral";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function add(n: number, a: number) {
  return n + a;
}

/**
 * Form inputs long and versus are both formatted address,symbol.
 * This function parses the address from them.
 */
export function parseAddress(s: string) {
  if (!s) return "";
  return s.split(",")[0] ?? "";
}
export function mapLeverage(key: string): string | undefined {
  if (key === "2") {
    return "5";
  } else if (key === "1") {
    return "3";
  } else if (key === "0") {
    return "2";
  } else if (key === "-1") {
    return "1.5";
  } else if (key === "-2") {
    return "1.25";
  } else if (key === "-3") {
    return "1.125";
  } else if (key === "-4") {
    return "1.0635";
  } else {
    return undefined; // Return undefined if the key does not match any condition
  }
}

export function formatDataInput(s: string) {
  return s.split(",")[0] ?? "";
}

export function getApeAddress({
  vaultId,
}: {
  vaultId: number | undefined;
  vaultAddress: TAddressString;
  apeHash: TAddressString;
}) {
  return vaultId;
}

export function roundDown(float: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  const roundedDown = Math.floor(float * factor) / factor;
  return roundedDown;
}

export function inputPatternMatch(s: string, decimals = 18) {
  const pattern = /^[0-9]*[.,]?[0-9]*$/;
  const scientificPattern = /^[0-9]*\.?[0-9]*[eE][-+]?[0-9]+$/;
  const decimalPattern = RegExp(`^\\d+(\\.\\d{0,${decimals}})?$`);
  
  if (s === "") {
    return true;
  }
  
  // Allow scientific notation for very small/large numbers
  if (scientificPattern.test(s)) {
    return true;
  }
  
  // Allow regular decimal patterns
  if (pattern.test(s) && decimalPattern.test(s)) {
    return true;
  }
  
  return false;
}

/**
 * Format descriptor for very small numbers that need subscript notation
 */
export type SmallNumberFormat = {
  type: 'small';
  sign: string;
  zeroCount: number;
  sigDigits: string;
};

/**
 * Format numbers for display with proper handling of large/small numbers
 * @param input - number, bigint, or string to format
 * @param significant - number of significant digits to display (default: 3)
 * @returns string for regular numbers, or SmallNumberFormat object for very small numbers
 */
export function formatNumber(input: number | string | bigint, significant = 3): string | SmallNumberFormat {
  // Handle bigint
  if (typeof input === "bigint") {
    return formatNumber(input.toString(), significant);
  }
  
  // Parse string input
  if (typeof input === "string") {
    const parsed = Number.parseFloat(input);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      return "0";
    }
    input = parsed;
  }

  // Handle NaN and non-finite numbers
  if (!Number.isFinite(input) || Number.isNaN(input)) {
    return "0";
  }

  const isNegative = input < 0;
  const absNumber = Math.abs(input);
  const sign = isNegative ? "-" : "";

  // Handle zero
  if (absNumber === 0) {
    return "0";
  }

  // Handle very small numbers (< 0.001) with subscript notation  
  if (absNumber < 0.001) {
    const numStr = absNumber.toString();
    let zeroCount = 0;
    let sigDigits = "";
    
    if (numStr.includes('e')) {
      // Scientific notation from JavaScript - convert to decimal
      const [mantissa, exponent] = numStr.split('e');
      const expNum = Math.abs(parseInt(exponent ?? "0"));
      const mantissaNum = parseFloat(mantissa ?? "0");
      zeroCount = expNum - 1;
      
      // Get the significant digits without padding
      const mantissaStr = mantissaNum.toString().replace('.', '');
      sigDigits = mantissaStr.slice(0, significant);
    } else {
      // Regular decimal
      const parts = numStr.split('.');
      const decimalPart = parts[1] ?? "";
      
      for (const digit of decimalPart) {
        if (digit === '0') {
          zeroCount++;
        } else {
          break;
        }
      }
      
      // Get only the actual significant digits available, don't pad
      const remainingDigits = decimalPart.slice(zeroCount);
      sigDigits = remainingDigits.slice(0, significant);
    }
    
    return {
      type: 'small' as const,
      sign,
      zeroCount,
      sigDigits
    };
  }

  // Handle small numbers (0.001 <= n < 1) - just show normal decimal
  if (absNumber >= 0.001 && absNumber < 1) {
    // For numbers between 0.001 and 1, use toPrecision to get significant digits
    const formatted = absNumber.toPrecision(significant);
    // Remove unnecessary trailing zeros and decimal point if not needed
    const cleaned = parseFloat(formatted).toString();
    return `${sign}${cleaned}`;
  }

  // Handle regular numbers (1 <= n <= 999)
  if (absNumber >= 1 && absNumber <= 999) {
    // Use toPrecision for consistent significant digits
    const formatted = absNumber.toPrecision(significant);
    const cleaned = parseFloat(formatted).toString();
    return `${sign}${cleaned}`;
  }

  // Handle large numbers (> 999) with K, M, B notation
  if (absNumber > 999) {
    // Calculate appropriate decimal places for the given significant digits
    const orderOfMagnitude = Math.floor(Math.log10(absNumber));
    const leadingDigits = Math.floor(orderOfMagnitude / 3) * 3; // Round down to nearest thousand power
    const remainingDigits = orderOfMagnitude - leadingDigits;
    const decimalPlaces = Math.max(0, significant - remainingDigits - 1);
    
    // Create format string for numeral.js
    const formatStr = decimalPlaces > 0 ? `0.${'0'.repeat(decimalPlaces)}a` : '0a';
    let formatted = numeral(absNumber).format(formatStr).toUpperCase();
    
    // Remove trailing zeros and unnecessary decimal points
    formatted = formatted.replace(/\.0+([KMBTQ])$/, '$1'); // Remove .0, .00, etc before suffix
    formatted = formatted.replace(/(\.\d*?)0+([KMBTQ])$/, '$1$2'); // Remove trailing zeros after decimal
    formatted = formatted.replace(/\.([KMBTQ])$/, '$1'); // Remove empty decimal point
    
    return `${sign}${formatted}`;
  }

  // Fallback for edge cases
  const rounded = roundDown(absNumber, 10);
  return `${sign}${rounded.toString()}`;
}

/**
 * @deprecated Use formatNumber instead. This function will be removed.
 */
export function formatSmallNumber(number: number): string {
  // Legacy function - just return the number as string for now
  return number.toString();
}

export function formatBigInt(b: bigint | undefined, fixed: number) {
  const parsed =
    Math.floor(parseFloat(formatUnits(b ?? 0n, 18)) * 10 ** fixed) /
    10 ** fixed;
  return parseFloat(parsed.toFixed(fixed));
}


export function compareAddress(a?: string, b?: string) {
  return a?.toLowerCase() === b?.toLowerCase();
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function getCurrentTime() {
  return Math.floor(Date.now() / 1000);
}
