"use client";
import { Addreth, AddrethConfig } from "addreth";
import Link from "next/link";
import React from "react";
import useLocalStorage from "use-local-storage";
import type { Address } from "viem";
import { env } from "@/env";

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
  const [isDark] = useLocalStorage<boolean>(
    "isDark",
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  return (
    <Link
      href={`https://${chainId === 1 ? "" : "sepolia."}etherscan.io/address/${address}`}
      target="_blank"
      className="-ml-2 flex h-[32px] items-center gap-x-1"
    >
      <AddrethConfig>
        <Addreth
          address={address as Address}
          actions="none"
          icon={false}
          uppercase
          theme={{
            textColor: isDark ? "#FFF" : "#000",
            badgeBackground: "#0000",
            fontSize,
          }}
          shortenAddress={shortenLength}
          underline
        />
      </AddrethConfig>

      {/* <span>{parseAddress(address)}</span>
      <ExternalLink size={12} /> */}
    </Link>
  );
};

export default AddressExplorerLink;
