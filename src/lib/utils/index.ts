import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits } from "viem";
import type { TAddressString } from "../types";
import numeral from "numeral";
import { BASE_FEE, L_FEE } from "@/data/constants";
import { getLeverageRatio } from "./calculations";
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
  return s.split(",")[0];
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
    if (!parts[0]) {
      return "0";
    }
    // show only three most sign digits
    const sig = 3 - parts[0].length ?? 0;
    return Number.parseFloat(
      `${parts[0]}.${parts[1]?.slice(0, sig)}`,
    ).toString();
  }

  if (n === 0) {
    return "0";
  }
  if (n < 1 && n >= 0.001) {
    const parts = n.toString().split(".");
    // return trimToSignificantDigits(n).toString();
    let zeros = 0;
    if (parts[1]?.split("")) {
      for (const digit of parts[1]?.split("")) {
        if (digit === "0") {
          zeros++;
        } else {
          // break once you hit a number other then 0
          break;
        }
      }
    }
    return Number.parseFloat(
      `0.${parts[1]?.slice(0, decimals + zeros)}`,
    ).toString();
  }
  if (n < 0.001) {
    const factor = Math.pow(10, 10);
    const roundedDown = Math.floor(n * factor) / factor;
    return roundedDown.toExponential();
  }
  if (n > 999) {
    const num = numeral(n);
    const f = num.format("0.000a").toUpperCase();
    const parts = f.split(".");

    if (!parts[0]) {
      return "0";
    }
    // show only three most sign digits
    const sig = 3 - parts[0].length ?? 0;

    return (
      Number.parseFloat(`${parts[0]}.${parts[1]?.slice(0, sig)}`).toString() +
      `${f[f.length - 1]}`
    );
  }
  if (decimals) {
    n = roundDown(n, 10);
  }

  return n.toString();
}
export function formatSmallNumber(number: number) {
  const num = number.toString();
  console.log(num, "NUM");
  if (num.includes("e")) {
    // number is in scientific notation
    const sige = parseInt(num.split("e")[1] ?? "0");
    const nums = parseInt(
      num.split("e")[0]?.replace(".", "").slice(0, 3) ?? "0",
    );

    console.log({ sige }, parseInt(num.split("e")[0] ?? "0"));
    const result = "0.0" + `v${(Math.abs(sige) - 1).toString()}` + nums;
    console.log({ result });
    return result;
  }
  const decimalPart = num.split(".")[1];
  if (decimalPart === undefined) {
    return "0";
  }
  let zeros = 0;
  for (const i of decimalPart) {
    if (i === "0") {
      zeros++;
    }
  }
  const sig = decimalPart.slice(zeros, zeros + 3);
  const result = "0.0" + `v${(zeros - 1).toString()}` + sig;
  return result;
}
export function formatBigInt(b: bigint | undefined, fixed: number) {
  const parsed =
    Math.floor(parseFloat(formatUnits(b ?? 0n, 18)) * 10 ** fixed) /
    10 ** fixed;
  return parseFloat(parsed.toFixed(fixed));
}

export function calculateStakingAPR(
  stakedSir: bigint,
  amountEth: bigint,
  rounding: bigint,
) {
  const totalValue = 500n / 3n;
  const sirPrice = totalValue / 20000000n;
  const ethPrice = 2000n;
  // need rounding because bigint doesn't go below 0, too keep decimals places
  const result =
    (12n * 100n * amountEth * ethPrice * rounding) / (sirPrice * stakedSir);
  return result / rounding;
}

/**
 *
 * @param k - Leverage Tier should be values -4 to 2
 * @returns number
 */
export function calculateApeVaultFee(k: number) {
  const l = getLeverageRatio(k);
  const a = 1 / (1 + (l - 1) * BASE_FEE);
  return (1 * 10 - a * 10) / 10;
}

/**
 *
 * @param k - Leverage Tier should be values -4 to 2
 * @returns number
 */
export function calculateTeaVaultFee() {
  const a = 1 / (1 + L_FEE);
  return (1 * 10 - a * 10) / 10;
}
