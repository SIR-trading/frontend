/**
 * Calculate the price increase needed to reach a target value
 * Formula for collateral: g = (targetValue/currentValue)^(1/(l-1))
 * Formula for debt: g = (targetValue/currentValue)^(1/l)
 * Where:
 * - targetValue is the target (break-even, 2x initial, x10 initial)
 * - currentValue is the current value
 * - l is the leverage (e.g., 2x, 3x, 5x, 9x)
 * - g is the required price increase factor
 */
export function calculatePriceIncreaseToTarget(
  targetValue: number,
  currentValue: number,
  leverage: number,
  isCollateral: boolean,
): number | null {
  // If current value is 0 or negative, can't calculate
  if (currentValue <= 0) return null;

  // If already at or above target, return 0 (no increase needed)
  if (currentValue >= targetValue) return 0;

  const ratio = targetValue / currentValue;

  // Calculate the exponent based on whether it's collateral or debt
  const exponent = isCollateral ? 1 / (leverage - 1) : 1 / leverage;

  // Calculate the required price increase factor
  const priceFactor = Math.pow(ratio, exponent);

  // Convert to percentage increase (subtract 1 and multiply by 100)
  const percentageIncrease = (priceFactor - 1) * 100;

  // Ensure we don't return negative values (shouldn't happen, but just in case)
  return Math.max(0, percentageIncrease);
}

/**
 * Calculate the break-even price increase for APE positions
 * This is a convenience function that uses the initial value as target
 */
export function calculateBreakevenPriceIncrease(
  initialValue: number,
  currentValue: number,
  leverage: number,
  isCollateral: boolean,
): number | null {
  return calculatePriceIncreaseToTarget(
    initialValue,
    currentValue,
    leverage,
    isCollateral,
  );
}

/**
 * Calculate the break-even time for TEA positions
 * Formula: time = (365 days) * log(y/x) / log(g)
 * Where:
 * - y is the initial collateral value (collateralTotal)
 * - x is the current collateral value
 * - g is the annual growth factor (1 + APY/100)
 * Returns time in days
 */
export function calculateBreakevenTime(
  initialValue: number,
  currentValue: number,
  apyPercentage: number,
): number | null {
  // If current value is 0 or negative, can't calculate
  if (currentValue <= 0) return null;

  // If APY is 0 or negative, can't break even
  if (apyPercentage <= 0) return null;

  // If already profitable (current >= initial), return 0
  if (currentValue >= initialValue) return 0;

  const ratio = initialValue / currentValue;

  // Convert APY percentage to annual growth factor
  // For example, 200% APY means g = 3 (triple in one year)
  const annualGrowthFactor = 1 + apyPercentage / 100;

  // Calculate break-even time in years using logarithms
  const yearsToBreakeven = Math.log(ratio) / Math.log(annualGrowthFactor);

  // Convert to days
  const daysToBreakeven = yearsToBreakeven * 365;

  return daysToBreakeven;
}

/**
 * Format break-even time for display
 * Converts days to a human-readable format (days, months, or years)
 */
export function formatBreakevenTime(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "✓"; // Already profitable

  if (days < 30) {
    return `${Math.round(days)}d`;
  } else if (days < 365) {
    const months = days / 30;
    return `${months.toFixed(1)}m`;
  } else {
    const years = days / 365;
    return `${years.toFixed(1)}y`;
  }
}

/**
 * Format break-even price increase for display
 * Shows percentage or checkmark if already profitable
 * Uses 2 significant digits for consistency
 */
export function formatBreakevenPriceIncrease(
  percentage: number | null,
): string {
  if (percentage === null) return "—";
  if (percentage <= 0) return "✓"; // Already profitable (0 or negative means no increase needed)

  // Format with 2 significant digits
  const formatted = percentage.toPrecision(2);
  const num = parseFloat(formatted);

  // Return without decimal if it's a whole number after formatting
  if (num % 1 === 0) {
    return `+${Math.round(num)}%`;
  } else {
    return `+${num}%`;
  }
}

/**
 * Calculate the value gain given a price increase, accounting for initial fee
 * Formula: value_gain = (100 - feePercent) * (1 + priceGain)^leverage - 100
 *
 * @param priceGainPercent - The price gain percentage (e.g., 50 for +50%)
 * @param leverage - The leverage multiplier (e.g., 2, 3, 5, 9)
 * @param feePercent - The initial fee percentage (e.g., 10 for 10%)
 * @returns The resulting value gain percentage
 */
export function calculateValueGainFromPriceGain(
  priceGainPercent: number,
  leverage: number,
  feePercent: number,
): number {
  // Convert percentage to decimal factor (e.g., 50% -> 1.5)
  const priceFactor = 1 + priceGainPercent / 100;

  // Account for fee reducing the starting amount (e.g., 10% fee -> 90% remaining)
  const postFeeAmount = 100 - feePercent;

  // Calculate the value gain with exponential leverage
  const valueGainPercent = postFeeAmount * Math.pow(priceFactor, leverage) - 100;

  return valueGainPercent;
}

/**
 * Core gain function f(x) for APE positions with saturation:
 * - f(x) = x^exp if x <= 1 (power zone - convex gains)
 * - f(x) = exp*(x-1) + 1 if x > 1 (saturation zone - linear gains)
 *
 * Where x = price / saturationPrice
 * exp = (l-1) for collateral-denominated, l for debt-denominated
 *
 * The exponent difference:
 * - Collateral gain = priceRatio^(l-1)
 * - Debt gain = priceRatio^l = collateralGain * priceRatio
 */
function f(x: number, exp: number): number {
  if (x <= 1) {
    return Math.pow(x, exp);
  } else {
    return exp * (x - 1) + 1;
  }
}

/**
 * Inverse of the gain function f(x)
 * Given F = f(x), returns x
 */
function fInverse(F: number, exp: number): number {
  if (F <= 1) {
    // Power zone: F = x^exp => x = F^(1/exp)
    return Math.pow(F, 1 / exp);
  } else {
    // Saturation zone: F = exp*(x-1) + 1 => x = (F - 1)/exp + 1
    return (F - 1) / exp + 1;
  }
}


/**
 * Calculate the price increase needed to reach a target value, accounting for
 * saturation (limited LP liquidity).
 *
 * The gain formula with saturation is:
 *   G = f(g₁) / f(g₀)
 *
 * Where:
 * - g₀ = currentPrice / saturationPrice (current normalized price)
 * - g₁ = targetPrice / saturationPrice (target normalized price)
 * - f(x) = x^l for x ≤ 1 (power zone), l*(x-1)+1 for x > 1 (saturation zone)
 *
 * For collateral-denominated targets:
 *   We solve f(g₁) = R × f(g₀) where R = targetValue / currentValue
 *
 * For debt-token-denominated targets:
 *   Gain includes price change: G_debt = [f(g₁)/f(g₀)] × [g₁/g₀]
 *   We solve f(g₁) × g₁ = R × f(g₀) × g₀
 *
 * @param targetValue - The target value to reach (e.g., initialCollateral for break-even)
 * @param currentValue - The current value (from quoteBurn)
 * @param leverage - The leverage ratio (e.g., 2, 3, 5, 9)
 * @param currentPrice - Current market price of collateral/debt pair
 * @param saturationPrice - The saturation price (from vault reserves)
 * @param isCollateral - Whether computing for collateral or debt token denomination
 * @returns The required price increase percentage, or null if can't calculate
 */
export function calculatePriceIncreaseWithSaturation(
  targetValue: number,
  currentValue: number,
  leverage: number,
  currentPrice: number,
  saturationPrice: number,
  isCollateral: boolean,
): number | null {
  // Validation
  if (currentValue <= 0 || currentPrice <= 0 || saturationPrice <= 0) {
    return null;
  }

  // If already at or above target, return 0 (no increase needed)
  if (currentValue >= targetValue) return 0;

  // Required gain ratio
  const R = targetValue / currentValue;

  // Current normalized price
  const g0 = currentPrice / saturationPrice;

  // The exponent differs based on denomination:
  // - Collateral gain = priceRatio^(l-1)
  // - Debt gain = priceRatio^l
  // Both use: gain = f(g1)/f(g0), just with different exponents
  const exp = isCollateral ? leverage - 1 : leverage;

  // Solve f(g₁) = R × f(g₀)
  const f0 = f(g0, exp);
  const F = R * f0;
  const g1 = fInverse(F, exp);

  // Calculate required price increase percentage
  const priceIncrease = (g1 / g0 - 1) * 100;

  // Ensure we don't return negative values
  return Math.max(0, priceIncrease);
}
