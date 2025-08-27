// Calculation utilities for fees and leverage
// All functions now accept parameters directly for maximum flexibility
// Use BASE_FEE and MINTING_FEE from @/lib/buildData when calling these functions

/**
 *
 * @param k - Leverage Tier should be values -4 to 2
 * @param baseFee - The base fee as decimal (e.g., 0.025 for 2.5%)
 * @returns number
 */
export function calculateApeVaultFee(k: number, baseFee: number) {
  const l = getLeverageRatio(k);
  const b = (1 + (l - 1) * baseFee) ** 2;
  const a = 1 / b;
  return (1 * 10 - a * 10) / 10;
}

/**
 *
 * @param k - Leverage Tier should be values -4 to 2
 * @param mintingFee - The minting fee as decimal (e.g., 0.005 for 0.5%)
 * @returns number
 */
export function calculateTeaVaultFee(mintingFee: number) {
  const a = 1 / (1 + mintingFee);
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

    const gentlemenReserveMinInc = gentlemenReserve - gentlemenReserveMin;

    const denominator = 10_000n * 510n + baseFeeBigInt * (taxAmountBigInt - 510n);

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

/**
 * Check if vault is currently in power zone based on reserves
 * @param reserveApes - bigint - The APE reserve amount
 * @param reserveLPers - bigint - The LPer (TEA) reserve amount
 * @param leverageRatio - number - The leverage ratio (1 + 2^k)
 * @returns true if in power zone, false if in saturation zone
 */
export function isVaultInPowerZone(
  reserveApes: bigint,
  reserveLPers: bigint,
  l: number // leverage ratio
): boolean {
  if (reserveApes === 0n || l <= 1) return true;
  
  const rApe = Number(reserveApes);
  const rLPer = Number(reserveLPers);
  
  // Power zone when: rApe * (l - 1) < rLPer
  return rApe * (l - 1) < rLPer;
}

/**
 * Calculate the saturation price for a vault based on current price and zone
 * @param currentPrice - number - The current price to calculate saturation from
 * @param reserveApes - bigint - The APE reserve amount
 * @param reserveLPers - bigint - The LPer (TEA) reserve amount
 * @param leverageRatio - number - The leverage ratio (1 + 2^k)
 * @returns The saturation price
 */
export function calculateSaturationPrice(
  currentPrice: number,
  reserveApes: bigint,
  reserveLPers: bigint,
  l: number // leverage ratio
): number {
  if (reserveApes === 0n || l <= 1) return 0;
  
  const rApe = Number(reserveApes);
  const rLPer = Number(reserveLPers);
  const rTotal = rApe + rLPer;
  const lMinus1 = l - 1;
  
  // Check if vault is in power zone
  const inPowerZone = isVaultInPowerZone(reserveApes, reserveLPers, l);
  
  if (inPowerZone) {
    // Power zone: pSat = p * (rTotal / (l * rApe))^(1/(l-1))
    const ratio = rTotal / (l * rApe);
    return currentPrice * Math.pow(ratio, 1 / lMinus1);
  } else {
    // Saturation zone: pSat = (l/(l-1)) * p * (rLPer/rTotal)
    return (l / lMinus1) * currentPrice * (rLPer / rTotal);
  }
}

/**
 * Calculate collateral gain with liquidity constraints
 * @param entryPrice - number - Entry price
 * @param exitPrice - number - Exit price
 * @param currentPrice - number - Current market price (for saturation calculation)
 * @param leverageTier - number - Leverage tier (k)
 * @param reserveApes - bigint - APE reserve amount
 * @param reserveLPers - bigint - LPer reserve amount
 * @param considerLiquidity - boolean - Whether to consider liquidity constraints
 * @returns Collateral gain multiplier
 */
export function calculateCollateralGainWithLiquidity(
  entryPrice: number,
  exitPrice: number,
  currentPrice: number,
  leverageTier: number,
  reserveApes: bigint,
  reserveLPers: bigint,
  considerLiquidity = true
): number {
  const l = getLeverageRatio(leverageTier);
  const lMinus1 = l - 1; // This equals 2^leverageTier
  
  // If not considering liquidity, use simple power formula
  if (!considerLiquidity || !reserveApes || !reserveLPers) {
    return (exitPrice / entryPrice) ** lMinus1;
  }
  
  // Check current vault zone status
  const vaultInPowerZone = isVaultInPowerZone(reserveApes, reserveLPers, l);
  console.log("Vault currently in power zone:", vaultInPowerZone);
  
  // Calculate saturation price based on current market price
  const pSat = calculateSaturationPrice(currentPrice, reserveApes, reserveLPers, l);
  console.log("Saturation Price (using current price", currentPrice, "):", pSat);
  
  // Determine which zone each price is in
  const entryInPower = entryPrice < pSat;
  const exitInPower = exitPrice < pSat;
  console.log("Entry in power zone:", entryInPower, "Exit in power zone:", exitInPower);
  
  // Case 1: Both in power zone - use standard power formula
  if (entryInPower && exitInPower) {
    return (exitPrice / entryPrice) ** lMinus1;
  }
  
  // Case 2: Both in saturation zone - use saturation formula
  if (!entryInPower && !exitInPower) {
    // Gain ratio in saturation zone
    const gainEntry = l - lMinus1 * (pSat / entryPrice);
    const gainExit = l - lMinus1 * (pSat / exitPrice);
    return gainExit / gainEntry;
  }
  
  // Case 3: Entry in power, exit in saturation
  if (entryInPower && !exitInPower) {
    // Power gain from entry to saturation boundary
    const powerGain = (pSat / entryPrice) ** lMinus1;
    // Saturation gain from boundary to exit
    const satGain = l - lMinus1 * (pSat / exitPrice);
    return powerGain * satGain;
  }
  
  // Case 4: Entry in saturation, exit in power (price decrease scenario)
  if (!entryInPower && exitInPower) {
    // Inverse saturation gain from entry to boundary
    const satGain = 1 / (l - lMinus1 * (pSat / entryPrice));
    // Power gain from boundary to exit
    const powerGain = (exitPrice / pSat) ** lMinus1;
    return satGain * powerGain;
  }
  
  // Default fallback (should never reach)
  return (exitPrice / entryPrice) ** lMinus1;
}
