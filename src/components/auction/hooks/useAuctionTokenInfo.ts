import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { api } from "@/trpc/react";
import { SirContract } from "@/contracts/sir";
import { useApproveErc20 } from "@/components/shared/hooks/useApproveErc20";

type Props = {
  tokenAddress?: string;
  amount: string;
  isOpen: boolean;
};

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export default function useAuctionTokenInfo({
  tokenAddress,
  amount,
  isOpen,
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

  const { data: tokenDecimals } = api.erc20.getErc20Decimals.useQuery(
    {
      tokenAddress: tokenAddress ?? "0x",
    },
    {
      enabled: isOpen && Boolean(tokenAddress),
    },
  );

  const { approveSimulate, needsApproval, needs0Approval } = useApproveErc20({
    tokenAddr: tokenAddress ?? "",
    approveContract: SirContract.address,
    amount: parseUnits(amount ?? "0", tokenDecimals ?? 18),
    allowance: userBalance?.tokenAllowance?.result ?? 0n,
  });

  return {
    userBalance,
    tokenDecimals,
    userBalanceFetching: isFetching,
    approveRequest: approveSimulate.data?.request,
    needsApproval: Boolean(
      tokenAddress === USDT_ADDRESS ? needs0Approval : needsApproval,
    ),
  };
}
