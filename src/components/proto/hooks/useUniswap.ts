import { useSimulateContract } from "wagmi";
import { UniswapV2Router } from "~/contracts/uniswap-v2-router";
import { TAddressString } from "~/lib/types";
import { parseUnits } from "viem";
import { WETH_ADDRESS } from "~/data/constants";
interface Props {
  token: TAddressString;
  userAddress: TAddressString;
}
export function useUniswap({ token, userAddress }: Props) {
  const { data } = useSimulateContract({
    address: UniswapV2Router.address,
    abi: UniswapV2Router.abi,
    functionName: "swapETHForExactTokens",
    args: [
      0n,
      [WETH_ADDRESS, token],
      userAddress,
      BigInt(Math.floor(Date.now() / 1000) + 60 * 10000000),
    ],
    value: parseUnits("1", 18),
  });
  return { data };
}
