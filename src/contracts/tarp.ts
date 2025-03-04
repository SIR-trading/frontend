import type { TAddressString } from "@/lib/types";

export const TarpContract = {
  address: `0x3ED05DE92879a5D47a3c8cc402DD5259219505aD` as TAddressString,
  abi: [
    {
      inputs: [],
      name: "mint",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const,
};
