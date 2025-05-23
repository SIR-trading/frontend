import { BASE_FEE, L_FEE } from "@/data/constants";
import { parseUnits } from "viem";
interface AprParams {
  ethDividends: bigint;
  amountOfStakedSir: bigint;
  sirUsdPrice: string;
  ethUsdPrice: string;
}

/**
 * calculateApr - Returns APR for SIR.
 * @returns bigint - Returns 0n if error.
 */
export function calculateApr({
  ethDividends,
  amountOfStakedSir,
  sirUsdPrice,
  ethUsdPrice,
}: AprParams) {
  try {
    console.log({ sirUsdPrice, ethUsdPrice });
    // Add zeros to keep decimals;
    // Since both are sides are multiplied keeps things porportional
    const sirPriceUsdBigInt = parseUnits(sirUsdPrice, 12);
    const ethPriceUsdBigInt = parseUnits(ethUsdPrice, 18);
    const ethDecimals = 10n ** 18n;
    const sirDecimals = 10n ** 12n;
    const ethInUsd = (ethDividends * ethPriceUsdBigInt) / ethDecimals;
    const sirInUsd = (amountOfStakedSir * sirPriceUsdBigInt) / sirDecimals;
    console.log({ amountOfStakedSir, ethDividends, sirInUsd, ethInUsd });
    const result = (12n * ethInUsd) / sirInUsd;
    return result * 100n;
  } catch (e) {
    console.log(e);
    return 0n;
  }
}
/**
 *
 * @param k - Leverage Tier should be values -4 to 2
 * @returns number
 */
export function calculateApeVaultFee(k: number) {
  const l = getLeverageRatio(k);
  const b = (1 + (l - 1) * BASE_FEE) ** 2;
  const a = 1 / b;
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

/**
 * To compute the leverage ratio: l = 1+2^k where k is the leverageTier.
 * @param LeverageTier - number
 *
 */
export function getLeverageRatio(k: number) {
  const result = 1 + 2 ** k;
  return result;
}

/**
 * Calculate maximum amount of ape that can be minted without causing insufficient liquidity.
 * @param LeverageTier - number
 *
 */
interface Params {
  leverageTier: bigint;
  baseFee: bigint;
  apeReserve: bigint;
  gentlemenReserve: bigint;
}
export function calculateMaxApe({
  leverageTier,
  baseFee,
  apeReserve,
  gentlemenReserve,
}: Params) {
  try {
    if (leverageTier > 0) {
      const nom =
        (10n ** 4n + 2n ** leverageTier * baseFee) *
        (4n * gentlemenReserve - 5n * 2n ** leverageTier * apeReserve);
      const result = nom / (2n ** (leverageTier + 2n) * (12500n - baseFee));
      return result;
    } else {
      const a = 5n * apeReserve;
      const nom =
        (2n ** -leverageTier * 10n ** 4n + baseFee) *
        (2n ** (2n - leverageTier) * gentlemenReserve - a);
      const dom = 2n ** (2n - leverageTier) * (12500n - baseFee);
      const result = nom / dom;
      return result;
    }
  } catch {
    return undefined;
  }
}
