"use client";
import React from "react";
import { useToast } from "../shared/hooks/useToast";
import { useEffect } from "react";
import useGetChainId from "../shared/hooks/useGetChainId";
import { useChainId } from "wagmi";

export default function Warning() {
  const { toast } = useToast();
  const chainId = useGetChainId();
  const wagmiChainId = useChainId();

  useEffect(() => {
    if (wagmiChainId === 11155111) {
      toast({
        title: "Warning",
        description:
          "You are currently on the Sepolia testnet. All transactions use test tokens (including ETH and ERC20), not real money.",
      });
    }
  }, [chainId, wagmiChainId, toast]);
  return <></>;
}
