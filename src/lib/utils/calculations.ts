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
 * @param leverageTier - bigint - The leverage tier
 * @param baseFeeBigInt - bigint - The base fee (will be divided by 10000)
 * @param apeReserve - bigint - The ape reserve amount
 * @param gentlemenReserve - bigint - The gentlemen reserve amount
 * @param taxAmountBigInt - bigint - The tax amount (will be divided by 255)
 *
 */
interface Params {
  leverageTier: bigint;
  baseFeeBigInt: bigint;
  apeReserve: bigint;
  gentlemenReserve: bigint;
  taxAmountBigInt: bigint;
}
export function calculateMaxApe({
  leverageTier,
  baseFeeBigInt,
  apeReserve,
  gentlemenReserve,
  taxAmountBigInt,
}: Params) {
  try {
    // leverageRatio = 2^leverageTier + 1
    console.log("_____________________________")
    console.log("leverageTier:", leverageTier);
    console.log("baseFeeBigInt:", baseFeeBigInt);
    console.log("gentlemenReserve:", gentlemenReserve);
    console.log("taxAmountBigInt:", taxAmountBigInt);

    const absoluteTier = 2n ** (leverageTier >= 0 ? leverageTier : -leverageTier);
    console.log("absoluteTier:", absoluteTier);

    // gentlemenReserveMin = (leverageRatio - 1) * apeReserve
    console.log("apeReserve:", apeReserve);
    const gentlemenReserveMin = leverageTier >= 0n ?
      apeReserve * absoluteTier:
      apeReserve / absoluteTier;
    console.log("gentlemenReserveMin:", gentlemenReserveMin);

    const gentlemenReserveMinInc = gentlemenReserve - 5n * gentlemenReserveMin / 4n;
    console.log("gentlemenReserveMinInc:", gentlemenReserveMinInc);

    const denominator = 12_500n * 610n - baseFeeBigInt * (610n - taxAmountBigInt);
    console.log("denominator:", denominator);

    // Handle leverage ratio calculation using only BigInt operations
    if (leverageTier < 0n) {
      const numerator = absoluteTier * 10_000n + baseFeeBigInt;
      const result = 610n * numerator * gentlemenReserveMinInc / denominator;
      return result;
    }

    const numerator =  10_000n + absoluteTier * baseFeeBigInt;
    console.log("numerator:", numerator);
    const result = 610n * numerator * gentlemenReserveMinInc / (denominator * absoluteTier);
    console.log("calculateMaxApe result:", result);
    return result;

  } catch (error) {
    console.error("Error in calculateMaxApe:", error);
    return undefined;
  }
}
