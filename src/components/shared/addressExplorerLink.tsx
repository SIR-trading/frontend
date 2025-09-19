"use client";
import Link from "next/link";
import React from "react";
import { useTheme } from "next-themes";
import { useEnsName } from "@/components/shared/hooks/useEnsName";
import { getCurrentChainConfig } from "@/lib/chains";

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
  const { ensName, isLoading } = useEnsName(address);
  const chainConfig = getCurrentChainConfig();

  // Function to shorten the address
  const shortenAddress = (addr: string, length: number) => {
    if (length === 0) return addr; // Don't shorten if length is 0
    return `${addr.slice(0, 6)}...${addr.slice(-length)}`;
  };

  // Determine what to display: ENS name if available, otherwise shortened address
  const displayText = ensName ?? shortenAddress(address, shortenLength);

  return (
    <Link
      href={`${chainConfig.explorerUrl}/address/${address}`}
      target="_blank"
      className="inline-block hover:underline"
    >
      <span style={{ fontSize, color: isDarkMode ? "#FFF" : "#000" }}>
        {isLoading ? shortenAddress(address, shortenLength) : displayText}
      </span>
    </Link>
  );
};

export default AddressExplorerLink;
