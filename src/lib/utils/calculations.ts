import { BASE_FEE, L_FEE } from "@/data/constants";

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

    const absoluteTier = 2n ** (leverageTier >= 0 ? leverageTier : -leverageTier);

    // gentlemenReserveMin = (leverageRatio - 1) * apeReserve
    const gentlemenReserveMin = leverageTier >= 0n ?
      apeReserve * absoluteTier:
      apeReserve / absoluteTier;

    const gentlemenReserveMinInc = gentlemenReserve - 5n * gentlemenReserveMin / 4n;

    const denominator = 12_500n * 510n + baseFeeBigInt * (taxAmountBigInt - 510n);

    // Handle leverage ratio calculation using only BigInt operations
    if (leverageTier < 0n) {
      const numerator = absoluteTier * 10_000n + baseFeeBigInt;
      const result = 510n * numerator * gentlemenReserveMinInc / denominator;
      return result;
    }

    const numerator =  10_000n + absoluteTier * baseFeeBigInt;
    const result = 510n * numerator * gentlemenReserveMinInc / (denominator * absoluteTier);
    return result;

  } catch (error) {
    return undefined;
  }
}
