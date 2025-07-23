"use client";
import Link from "next/link";
import React from "react";
import { env } from "@/env";
import { useTheme } from "next-themes";

const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);

const AddressExplorerLink = ({
  address,
  fontSize = 16,
  shortenLength = 6,
}: {
  address: string;
  fontSize?: number;
  shortenLength?: number;
}) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  
  // Function to shorten the address
  const shortenAddress = (addr: string, length: number) => {
    if (length === 0) return addr; // Don't shorten if length is 0
    return `${addr.slice(0, 6)}...${addr.slice(-length)}`;
  };
  
  return (
    <Link
      href={`https://${chainId === 1 ? "" : "sepolia."}etherscan.io/address/${address}`}
      target="_blank"
      className="-ml-2 flex h-[32px] items-center gap-x-1 hover:underline"
    >
      <span style={{ fontSize, color: isDarkMode ? "#FFF" : "#000" }}>
        {shortenAddress(address, shortenLength)}
      </span>
    </Link>
  );
};

export default AddressExplorerLink;
