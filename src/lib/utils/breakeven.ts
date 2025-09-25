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
