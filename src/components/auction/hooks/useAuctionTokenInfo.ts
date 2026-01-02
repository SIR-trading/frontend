import { parseUnits } from "viem";
import { useAccount, useBalance } from "wagmi";
import { api } from "@/trpc/react";
import { SirContract } from "@/contracts/sir";
import { useApproveErc20 } from "@/components/shared/hooks/useApproveErc20";
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";

type Props = {
  tokenAddress?: string;
  amount: string;
  isOpen: boolean;
  maxApprove: boolean;
  useNativeToken: boolean;
};

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export default function useAuctionTokenInfo({
  tokenAddress,
  amount,
  isOpen,
  maxApprove,
  useNativeToken,
}: Props) {
  const { address: userAddress } = useAccount();

  const { data: userBalance, isFetching } =
    api.user.getBalanceAndAllowance.useQuery(
      {
        userAddress,
        tokenAddress,
        spender: SirContract.address,
      },
      {
        enabled: isOpen && Boolean(userAddress) && Boolean(tokenAddress),
      },
    );

  // Fetch native token balance (HYPE on HyperEVM chains)
  const { data: nativeBalance, isFetching: isNativeFetching } = useBalance({
    address: userAddress,
    query: {
      enabled: isOpen && Boolean(userAddress) && tokenAddress === WRAPPED_NATIVE_TOKEN_ADDRESS,
    },
  });

  const { data: tokenDecimals } = api.erc20.getErc20Decimals.useQuery(
    {
      tokenAddress: tokenAddress ?? "0x",
    },
    {
      enabled: isOpen && Boolean(tokenAddress),
    },
  );

  // Skip approval logic when using native HYPE
  // Guard against invalid input (empty, ".", NaN) - only parse valid positive numbers
  const numAmount = Number(amount);
  const safeAmount = numAmount > 0 ? amount : "0";

  const { approveSimulate, needsApproval, needs0Approval } = useApproveErc20({
    tokenAddr: useNativeToken ? "" : (tokenAddress ?? ""),
    approveContract: SirContract.address,
    amount: parseUnits(safeAmount, tokenDecimals ?? 18),
    allowance: userBalance?.tokenAllowance?.result ?? 0n,
    useMaxApprove: maxApprove,
  });

  return {
    userBalance,
    userNativeTokenBalance: nativeBalance?.value,
    tokenDecimals,
    userBalanceFetching: isFetching || isNativeFetching,
    approveRequest: useNativeToken ? undefined : approveSimulate.data?.request,
    needsApproval: useNativeToken ? false : Boolean(
      tokenAddress === USDT_ADDRESS ? needs0Approval : needsApproval,
    ),
  };
}
