import { EContracts, getAddress } from "@/lib/contractAddresses";

export const AssistantContract = {
  address: getAddress(EContracts.ASSISTANT),
  abi: [
    {
      type: "constructor",
      inputs: [{ name: "vault_", type: "address", internalType: "address" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "VAULT",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "contract IVault" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getAddressAPE",
      inputs: [{ name: "vaultId", type: "uint48", internalType: "uint48" }],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getReserves",
      inputs: [
        { name: "vaultIds", type: "uint48[]", internalType: "uint48[]" },
      ],
      outputs: [
        {
          name: "reserves",
          type: "tuple[]",
          internalType: "struct SirStructs.Reserves[]",
          components: [
            { name: "reserveApes", type: "uint144", internalType: "uint144" },
            { name: "reserveLPers", type: "uint144", internalType: "uint144" },
            { name: "tickPriceX42", type: "int64", internalType: "int64" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getVaultStatus",
      inputs: [
        {
          name: "vaultParams",
          type: "tuple",
          internalType: "struct SirStructs.VaultParameters",
          components: [
            { name: "debtToken", type: "address", internalType: "address" },
            {
              name: "collateralToken",
              type: "address",
              internalType: "address",
            },
            { name: "leverageTier", type: "int8", internalType: "int8" },
          ],
        },
      ],
      outputs: [
        { name: "", type: "uint8", internalType: "enum Assistant.VaultStatus" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "priceOfAPE",
      inputs: [
        {
          name: "vaultParams",
          type: "tuple",
          internalType: "struct SirStructs.VaultParameters",
          components: [
            { name: "debtToken", type: "address", internalType: "address" },
            {
              name: "collateralToken",
              type: "address",
              internalType: "address",
            },
            { name: "leverageTier", type: "int8", internalType: "int8" },
          ],
        },
      ],
      outputs: [
        { name: "num", type: "uint256", internalType: "uint256" },
        { name: "den", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "priceOfTEA",
      inputs: [
        {
          name: "vaultParams",
          type: "tuple",
          internalType: "struct SirStructs.VaultParameters",
          components: [
            { name: "debtToken", type: "address", internalType: "address" },
            {
              name: "collateralToken",
              type: "address",
              internalType: "address",
            },
            { name: "leverageTier", type: "int8", internalType: "int8" },
          ],
        },
      ],
      outputs: [
        { name: "num", type: "uint256", internalType: "uint256" },
        { name: "den", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "quoteBurn",
      inputs: [
        { name: "isAPE", type: "bool", internalType: "bool" },
        {
          name: "vaultParams",
          type: "tuple",
          internalType: "struct SirStructs.VaultParameters",
          components: [
            { name: "debtToken", type: "address", internalType: "address" },
            {
              name: "collateralToken",
              type: "address",
              internalType: "address",
            },
            { name: "leverageTier", type: "int8", internalType: "int8" },
          ],
        },
        { name: "amountTokens", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "amountCollateral", type: "uint144", internalType: "uint144" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "quoteMint",
      inputs: [
        { name: "isAPE", type: "bool", internalType: "bool" },
        {
          name: "vaultParams",
          type: "tuple",
          internalType: "struct SirStructs.VaultParameters",
          components: [
            { name: "debtToken", type: "address", internalType: "address" },
            {
              name: "collateralToken",
              type: "address",
              internalType: "address",
            },
            { name: "leverageTier", type: "int8", internalType: "int8" },
          ],
        },
        { name: "amountCollateral", type: "uint144", internalType: "uint144" },
      ],
      outputs: [
        { name: "amountTokens", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "view",
    },
    { type: "error", name: "VaultCanBeCreated", inputs: [] },
  ] as const,
};
