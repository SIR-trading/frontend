import type { TAddressString } from "@/lib/types";
import buildData from "@/../public/build-data.json";

const SYSTEM_CONTROL_ADDRESS = buildData.contractAddresses
  .systemControl as TAddressString;

export const SystemControlContract = {
  address: SYSTEM_CONTROL_ADDRESS,
  abi: [
    {
      type: "function",
      name: "owner",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "updateVaultsIssuances",
      inputs: [
        { name: "oldVaults", type: "uint48[]", internalType: "uint48[]" },
        { name: "newVaults", type: "uint48[]", internalType: "uint48[]" },
        { name: "newTaxes", type: "uint8[]", internalType: "uint8[]" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const,
};

export const SYSTEM_CONTROL_OWNER = buildData.contractAddresses
  .systemControlOwner as TAddressString;
