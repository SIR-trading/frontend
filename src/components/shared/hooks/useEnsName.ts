"use client";
import { useEnsName as useWagmiEnsName } from "wagmi";
import { mainnet } from "wagmi/chains";

export const useEnsName = (address: string) => {
  const { data: ensName, isLoading } = useWagmiEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
  });

  return {
    ensName,
    isLoading,
  };
};
