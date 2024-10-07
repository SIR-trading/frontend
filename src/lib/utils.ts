import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatUnits, getAddress } from "viem";
import type { TAddressString, TMintFormFields, TVaults } from "./types";
import { assetSchema } from "./schemas";
import { z } from "zod";
import numeral from "numeral";
import { BASE_FEE, L_FEE } from "@/data/constants";
import { env } from "@/env";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function add(n: number, a: number) {
  return n + a;
}

export function getLogoAsset(address: `0x${string}` | undefined) {
  if (!address) {
    return "";
  }
  const getChainName = () => {
    const chainId = env.NEXT_PUBLIC_CHAIN_ID;
    if (chainId === "1") {
      return "ethereum";
    }
    if (chainId === "11155111") {
      return "sepolia";
    }
    if (chainId === "17000") {
      return "holesky";
    }
  };

  const chainName = getChainName();
  return `https://raw.githubusercontent.com/fusionxx23/assets/master/blockchains/${chainName}/assets/${getAddress(address)}/logo.png`;
}

export function getLogoJson(address: `0x${string}` | undefined) {
  if (!address) {
    return "";
  }
  const getChainName = () => {
    const chainId = env.NEXT_PUBLIC_CHAIN_ID;
    if (chainId === "1") {
      return "ethereum";
    }
    if (chainId === "11155111") {
      return "sepolia";
    }
    if (chainId === "17000") {
      return "holesky";
    }
  };

  const chainName = getChainName();
  return `https://raw.githubusercontent.com/fusionxx23/assets/master/blockchains/${chainName}/assets/${getAddress(address)}/info.json`;
}
export async function getAssetInfo(address: TAddressString | undefined) {
  if (!address) {
    throw Error("No address provided.");
  }
  const result: unknown = await fetch(
    `https://raw.githubusercontent.com/fusionxx23/assets/master/blockchains/ethereum/assets/${getAddress(address)}/info.json`,
  ).then((r) => r.json());
  return assetSchema.safeParse(result);
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
/**
 * To compute the leverage ratio: l = 1+2^k where k is the leverageTier.
 * @param LeverageTier - number
 *
 */
export function getLeverageRatio(k: number) {
  const result = 1 + 2 ** k;
  return result;
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
  // if (vaultId === undefined) {
  //   return "0xff" as TAddressString;
  // }
  // const packed = encodePacked(
  //   ["bytes1", "bytes20", "bytes32", "bytes32"],
  //   ["0xff", vaultAddress, toHex(vaultId, { size: 32 }), apeHash],
  // );
  // const raw = keccak256(packed);
  // const result = ("0x" + raw.slice(-40)) as TAddressString;

  return vaultId;
}

export function roundDown(float: number, decimals: number) {
  const factor = Math.pow(10, decimals);
  const roundedDown = Math.floor(float * factor) / factor;
  return roundedDown;
}

/**
 * @returns string | Will round down to 10th decimal
 */
export function formatNumber(
  number: number | string,
  decimals?: number,
): string {
  if (typeof number === "string") {
    number = parseFloat(number);
    if (!isFinite(number)) {
      return "0";
    }
  }
  // round down
  const factor = Math.pow(10, 10);
  let n = Math.floor(number * factor) / factor;

  if (n === 0) {
    return "0";
  }
  if (n < 0.000000001) {
    const factor = Math.pow(10, 10);
    const roundedDown = Math.floor(n * factor) / factor;
    return roundedDown.toExponential();
  }
  if (n > 9999) {
    const num = numeral(n);
    return num.format("0.0a");
  }
  if (decimals) {
    n = roundDown(n, decimals);
  }
  return n.toString();
}

export function formatBigInt(b: bigint | undefined, fixed: number) {
  const parsed =
    Math.floor(parseFloat(formatUnits(b ?? 0n, 18)) * 10 ** fixed) /
    10 ** fixed;
  return parseFloat(parsed.toFixed(fixed));
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
