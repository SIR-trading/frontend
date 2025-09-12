"use client";
import React from "react";
import { useToast } from "../shared/hooks/useToast";
import { useEffect } from "react";
import useGetChainId from "../shared/hooks/useGetChainId";
import { getNativeCurrencySymbol, getChainName } from "@/lib/chains";

export default function Warning() {
  const { toast } = useToast();
  const chainId = useGetChainId();
  useEffect(() => {
    // Show warning for all testnets
    if (chainId === 11155111 || chainId === 998) {
      toast({
        title: "Warning",
        description:
          `You are currently on the ${getChainName(chainId)}. All transactions use test tokens (including ${getNativeCurrencySymbol(chainId)} and ERC20), not real money.`,
      });
    }
  }, [chainId, toast]);
  return <></>;
}
