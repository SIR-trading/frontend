import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";
import type { TAddressString, TMintFormFields, TVaults } from "../types";
import { z } from "zod";
import numeral from "numeral";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function add(n: number, a: number) {
  return n + a;
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
export function findVault(vaultQuery: TVaults, formData: TMintFormFields) {
  const debtToken = formData.versus.split(",")[0] ?? "", //value formatted : address,symbol
    collateralToken = formData.long.split(",")[0] ?? ""; //value formatted : address,symbol
  const safeLeverageTier = z.coerce.number().safeParse(formData.leverageTier);
  const leverageTier = safeLeverageTier.success ? safeLeverageTier.data : -1;

  const result = vaultQuery?.vaults.find((v) => {
    if (
      v.collateralToken === collateralToken &&
      v.debtToken === debtToken &&
      leverageTier === v.leverageTier
    ) {
      return true;
    } else {
      return false;
    }
  });
  return { result };
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
  const decimalPattern = RegExp(`^\\d+(\\.\\d{0,${decimals}})?$`);
  if (s === "") {
    return true;
  }
  if (pattern.test(s) && decimalPattern.test(s)) return true;
  return false;
}
/**
 * @returns string | Will round down to 10th decimal
 */
export function formatNumber(number: number | string, decimals = 3): string {
  if (typeof number === "string") {
    number = Number.parseFloat(number);
    if (!Number.isFinite(number)) {
      return "0";
    }
  }

  let n = number;
  // round down

  if (number >= 1 && number <= 999) {
    const parts = n.toString().split(".");
    console.log(`${parts[0]}.${parts[1]?.slice(0, 3)}`);
    return Number.parseFloat(
      `${parts[0]}.${parts[1]?.slice(0, decimals)}`,
    ).toString();
  }

  if (n === 0) {
    return "0";
  }
  if (n < 1 && n >= 0.001) {
    const parts = n.toString().split(".");
    return Number.parseFloat(`0.${parts[1]?.slice(0, decimals)}`).toString();
  }
  if (n < 0.001) {
    const factor = Math.pow(10, 10);
    const roundedDown = Math.floor(n * factor) / factor;
    return roundedDown.toExponential();
  }
  if (n > 999) {
    const num = numeral(n);
    return num.format("0.00a").toUpperCase();
  }
  if (decimals) {
    n = roundDown(n, 10);
  }

  return n.toString();
}

export function formatBigInt(b: bigint | undefined, fixed: number) {
  const parsed =
    Math.floor(parseFloat(formatUnits(b ?? 0n, 18)) * 10 ** fixed) /
    10 ** fixed;
  return parseFloat(parsed.toFixed(fixed));
}
