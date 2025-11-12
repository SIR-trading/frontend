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
  const bidAmount = parseUnits(amount || "0", tokenDecimals ?? 18);

  return {
    token: token as Address | undefined,
    bidAmount,
    useNativeToken,
  };
};
