// Calculation utilities for fees and leverage
// All functions now accept parameters directly for maximum flexibility
// Use BASE_FEE and LP_FEE from @/lib/buildData when calling these functions

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
 * @param lpFee - The LP minting fee as decimal (e.g., 0.05 for 5%)
 * @returns number
 */
export function calculateTeaVaultFee(lpFee: number) {
  const a = 1 / (1 + lpFee);
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
 * Calculate maximum deposit such that APE slope in saturation >= perp slope.
 *
 * For APE to outperform perp even in saturation zone, we need the saturation
 * price to remain high enough after the deposit.
 *
 * Constraint: pSat >= p0 × f^(2/(l-1))
 *
 * Where:
 *   pSat = p0 × [(A+T) / (l×A)]^(1/(l-1))  (power zone formula)
 *   f = 1 + (l-1) × baseFee
 *
 * Substituting and simplifying:
 *   (A+T) / (l×A) >= f²
 *   T/A >= l×f² - 1
 *
 * So R = l×f² - 1 is the threshold ratio T/A must exceed.
 *
 * After deposit d:
 *   A' = A + d/f  (deposit after minting fee goes to ape reserve)
 *   T' = T + d×(f-1)×k/f  (fee portion × LP share goes to tea reserve)
 *
 * where k = (510 - tax) / 510
 *
 * Solving T'/A' >= R for max d:
 *   maxDeposit = f × (T - R×A) / [R - (f-1)×k]
 *
 * @param leverageTier - bigint - The leverage tier
 * @param baseFeeBigInt - bigint - The base fee scaled by 10000 (e.g., 250 for 2.5%)
 * @param apeReserve - bigint - The ape reserve amount
 * @param gentlemenReserve - bigint - The gentlemen (TEA) reserve amount
 * @param taxAmountBigInt - bigint - The tax amount (0-255)
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
}: Params): bigint | undefined {
  try {
    // Convert to numbers for floating point calculation
    // leverageRatio l = 1 + 2^leverageTier
    const tierNum = Number(leverageTier);
    const l = 1 + Math.pow(2, tierNum);

    // baseFee as decimal (baseFeeBigInt is scaled by 10000)
    const baseFee = Number(baseFeeBigInt) / 10000;

    // feeMultiplier f = 1 + (l-1) * baseFee
    const f = 1 + (l - 1) * baseFee;

    // R = l×f² - 1 is the threshold ratio T/A must exceed
    // Derived from: pSat >= p0 × f^(2/(l-1))
    // which becomes: T/A >= l×f² - 1
    const R = l * f * f - 1;

    // k = (510 - tax) / 510 (fraction of fee going to LP/tea reserve)
    const tax = Number(taxAmountBigInt);
    const k = (510 - tax) / 510;

    // Convert reserves to numbers
    const A = Number(apeReserve);
    const T = Number(gentlemenReserve);

    // Check if current state already violates constraint (T/A < R)
    // meaning APE can't beat perp even without any deposit
    if (T - R * A <= 0) {
      return 0n;
    }

    // Denominator: R - (f-1)×k
    const denom = R - (f - 1) * k;
    if (denom <= 0) {
      // Edge case: shouldn't happen with typical parameters
      // This would mean deposits always help, return unlimited
      return undefined;
    }

    // maxDeposit = f × (T - R×A) / [R - (f-1)×k]
    const maxDeposit = (f * (T - R * A)) / denom;

    if (maxDeposit <= 0 || !Number.isFinite(maxDeposit)) {
      return 0n;
    }

    return BigInt(Math.floor(maxDeposit));
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
  
  // Handle extreme liquidity values
  if (rLPer === 0 || !Number.isFinite(rLPer) || !Number.isFinite(rApe)) {
    return 0;
  }
  
  const rTotal = rApe + rLPer;
  const lMinus1 = l - 1;
  
  // Check if vault is in power zone
  const inPowerZone = isVaultInPowerZone(reserveApes, reserveLPers, l);
  
  if (inPowerZone) {
    // Power zone: pSat = p * (rTotal / (l * rApe))^(1/(l-1))
    const ratio = rTotal / (l * rApe);
    
    // Prevent infinity by capping extremely large ratios
    if (ratio > 1e10) {
      return currentPrice * 1e10; // Cap at a very large but finite number
    }
    
    const result = currentPrice * Math.pow(ratio, 1 / lMinus1);
    
    // Ensure result is finite
    if (!Number.isFinite(result)) {
      return currentPrice * 1e10; // Return a very large but finite number
    }
    
    return result;
  } else {
    // Saturation zone: pSat = (l/(l-1)) * p * (rLPer/rTotal)
    const result = (l / lMinus1) * currentPrice * (rLPer / rTotal);
    
    // Ensure result is finite
    if (!Number.isFinite(result)) {
      return currentPrice * 1e10; // Return a very large but finite number
    }
    
    return result;
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
  
  // Calculate saturation price based on current market price
  const pSat = calculateSaturationPrice(currentPrice, reserveApes, reserveLPers, l);
  
  // Determine which zone each price is in
  const entryInPower = entryPrice < pSat;
  const exitInPower = exitPrice < pSat;
  
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
