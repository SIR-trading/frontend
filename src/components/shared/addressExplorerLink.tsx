import { Addreth, AddrethConfig } from "addreth";
import Link from "next/link";
import React from "react";
import type { Address } from "viem";

const AddressExplorerLink = ({
  address,
  fontSize = 16,
  shortenLength = 6,
}: {
  address: string;
  fontSize?: number;
  shortenLength?: number;
}) => {
  return (
    <Link
      href={`https://etherscan.io/address/${address}`}
      target="_blank"
      className="-ml-2 flex items-center gap-x-1 "
    >
      <AddrethConfig>
        <Addreth
          address={address as Address}
          actions="none"
          icon={false}
          uppercase
          theme={{
            textColor: "#FFF",
            badgeBackground: "#0000",
            secondaryColor: "#FFF",
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
