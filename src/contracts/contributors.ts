import type { TAddressString } from "@/lib/types";
import buildData from "@/../public/build-data.json";

// Safely access contributors address with fallback for backward compatibility
const CONTRIBUTORS_ADDRESS = (buildData.contractAddresses as Record<string, unknown>).contributors as TAddressString | undefined;

export const ContributorsContract = {
  address: CONTRIBUTORS_ADDRESS ?? "0x0000000000000000000000000000000000000000",
  abi: [
    {
      type: "function",
      name: "allocations",
      inputs: [{ name: "user", type: "address", internalType: "address" }],
      outputs: [{ name: "", type: "uint56", internalType: "uint56" }],
      stateMutability: "view",
    },
  ],
} as const;
