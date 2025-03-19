import { useMemo } from "react";
import { erc20Abi, getAddress, zeroAddress } from "viem";
import { useReadContracts } from "wagmi";

export default function useRetrieveToken({
  tokenAddress,
}: {
  tokenAddress: string;
}) {
  const { address } = useMemo(() => {
    try {
      const checkedAddress = getAddress(tokenAddress);
      return { address: checkedAddress };
    } catch {
      return { address: null };
    }
  }, [tokenAddress]);
  const { data, error, isLoading } = useReadContracts({
    contracts: [
      {
        address: address ?? zeroAddress,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: address ?? zeroAddress,
        abi: erc20Abi,
        functionName: "name",
      },
    ],

    query: {
      enabled: !!address,
    },
  });
  console.log({ data, error });
  const symbol = data?.[0].result;
  const name = data?.[1].result;
  return { symbol, name, address, isLoading };
}
