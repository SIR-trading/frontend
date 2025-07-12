"use client";
import { Addreth, AddrethConfig } from "addreth";
import Link from "next/link";
import React from "react";
import { getAddress } from "viem";
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
  return (
    <Link
      href={`https://${chainId === 1 ? "" : "sepolia."}etherscan.io/address/${address}`}
      target="_blank"
      className="-ml-2 flex h-[32px] items-center gap-x-1 hover:underline"
    >
      <AddrethConfig>
        <Addreth
          address={getAddress(address)}
          actions="none"
          icon={false}
          theme={{
            textColor: isDarkMode ? "#FFF" : "#000",
            badgeBackground: "#0000",
            fontSize,
          }}
          shortenAddress={shortenLength}
        />
      </AddrethConfig>

      {/* <span>{parseAddress(address)}</span>
      <ExternalLink size={12} /> */}
    </Link>
  );
};

export default AddressExplorerLink;
