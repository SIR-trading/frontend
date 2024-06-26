export const ApeContract = {
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [],
      name: "InvalidSigner",
      type: "error",
    },
    {
      inputs: [],
      name: "PermitDeadlineExpired",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [],
      name: "DOMAIN_SEPARATOR",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "OWNER",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "PERMIT_TYPEHASH",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "uint16",
          name: "baseFee",
          type: "uint16",
        },
        {
          internalType: "uint8",
          name: "tax",
          type: "uint8",
        },
        {
          components: [
            {
              internalType: "uint144",
              name: "reserveApes",
              type: "uint144",
            },
            {
              internalType: "uint144",
              name: "reserveLPers",
              type: "uint144",
            },
            {
              internalType: "int64",
              name: "tickPriceX42",
              type: "int64",
            },
          ],
          internalType: "struct VaultStructs.Reserves",
          name: "reserves",
          type: "tuple",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "burn",
      outputs: [
        {
          components: [
            {
              internalType: "uint144",
              name: "reserveApes",
              type: "uint144",
            },
            {
              internalType: "uint144",
              name: "reserveLPers",
              type: "uint144",
            },
            {
              internalType: "int64",
              name: "tickPriceX42",
              type: "int64",
            },
          ],
          internalType: "struct VaultStructs.Reserves",
          name: "newReserves",
          type: "tuple",
        },
        {
          internalType: "uint144",
          name: "collectedFee",
          type: "uint144",
        },
        {
          internalType: "uint144",
          name: "polFee",
          type: "uint144",
        },
        {
          internalType: "uint144",
          name: "collateralWidthdrawn",
          type: "uint144",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "collateralToken",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "debtToken",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "leverageTier",
      outputs: [
        {
          internalType: "int8",
          name: "",
          type: "int8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint16",
          name: "baseFee",
          type: "uint16",
        },
        {
          internalType: "uint8",
          name: "tax",
          type: "uint8",
        },
        {
          components: [
            {
              internalType: "uint144",
              name: "reserveApes",
              type: "uint144",
            },
            {
              internalType: "uint144",
              name: "reserveLPers",
              type: "uint144",
            },
            {
              internalType: "int64",
              name: "tickPriceX42",
              type: "int64",
            },
          ],
          internalType: "struct VaultStructs.Reserves",
          name: "reserves",
          type: "tuple",
        },
        {
          internalType: "uint144",
          name: "collateralDeposited",
          type: "uint144",
        },
      ],
      name: "mint",
      outputs: [
        {
          components: [
            {
              internalType: "uint144",
              name: "reserveApes",
              type: "uint144",
            },
            {
              internalType: "uint144",
              name: "reserveLPers",
              type: "uint144",
            },
            {
              internalType: "int64",
              name: "tickPriceX42",
              type: "int64",
            },
          ],
          internalType: "struct VaultStructs.Reserves",
          name: "newReserves",
          type: "tuple",
        },
        {
          internalType: "uint144",
          name: "collectedFee",
          type: "uint144",
        },
        {
          internalType: "uint144",
          name: "polFee",
          type: "uint144",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      name: "nonces",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "deadline",
          type: "uint256",
        },
        {
          internalType: "uint8",
          name: "v",
          type: "uint8",
        },
        {
          internalType: "bytes32",
          name: "r",
          type: "bytes32",
        },
        {
          internalType: "bytes32",
          name: "s",
          type: "bytes32",
        },
      ],
      name: "permit",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const,
};
