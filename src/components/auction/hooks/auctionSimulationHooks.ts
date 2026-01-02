import { parseUnits, type Address } from "viem";

// Refactored to return contract config data instead of simulating
// Direct writeContract calls should be used following CLAUDE.md guidelines
export const useBidConfig = ({
  token,
  amount,
  tokenDecimals,
  useNativeToken,
}: {
  token?: string;
  amount: string;
  tokenDecimals?: number;
  useNativeToken?: boolean;
}) => {
  // Guard against invalid input (empty, ".", NaN) - only parse valid positive numbers
  const numAmount = Number(amount);
  const safeAmount = numAmount > 0 ? amount : "0";
  const bidAmount = parseUnits(safeAmount, tokenDecimals ?? 18);

  return {
    token: token as Address | undefined,
    bidAmount,
    useNativeToken,
  };
};
