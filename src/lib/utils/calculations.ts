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
  console.log(leverageTier, "LEVERAGE TIER");
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
      console.log({ result });
      return result;
    }
  } catch {
    return undefined;
  }
}
