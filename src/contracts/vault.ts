import { EContracts, getAddress } from "@/lib/contractAddresses";

export const VaultContract = {
  address: getAddress(EContracts.VAULT),
  abi: [
    {
      type: "constructor",
      inputs: [
        { name: "systemControl", type: "address", internalType: "address" },
        { name: "sir", type: "address", internalType: "address" },
        { name: "oracle", type: "address", internalType: "address" },
        { name: "apeImplementation", type: "address", internalType: "address" },
        { name: "weth", type: "address", internalType: "address" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "APE_IMPLEMENTATION",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "ORACLE",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "contract Oracle" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "SIR",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "SYSTEM_CONTROL",
      inputs: [],
      outputs: [{ name: "", type: "address", internalType: "address" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "TIMESTAMP_ISSUANCE_START",
      inputs: [],
      outputs: [{ name: "", type: "uint40", internalType: "uint40" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "balanceOf",
      inputs: [
        { name: "account", type: "address", internalType: "address" },
        { name: "vaultId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "balanceOfBatch",
      inputs: [
        { name: "owners", type: "address[]", internalType: "address[]" },
        { name: "vaultIds", type: "uint256[]", internalType: "uint256[]" },
      ],
      outputs: [
        { name: "balances_", type: "uint256[]", internalType: "uint256[]" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "burn",
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
        { name: "amount", type: "uint256", internalType: "uint256" },
        { name: "deadline", type: "uint40", internalType: "uint40" },
      ],
      outputs: [{ name: "", type: "uint144", internalType: "uint144" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "claimSIR",
      inputs: [
        { name: "vaultId", type: "uint256", internalType: "uint256" },
        { name: "lper", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "uint80", internalType: "uint80" }],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "cumulativeSIRPerTEA",
      inputs: [{ name: "vaultId", type: "uint256", internalType: "uint256" }],
      outputs: [
        {
          name: "cumulativeSIRPerTEAx96",
          type: "uint176",
          internalType: "uint176",
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getReserves",
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
        {
          name: "",
          type: "tuple",
          internalType: "struct SirStructs.Reserves",
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
      name: "initialize",
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
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "isApprovedForAll",
      inputs: [
        { name: "", type: "address", internalType: "address" },
        { name: "", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "bool", internalType: "bool" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "mint",
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
        { name: "amountToDeposit", type: "uint256", internalType: "uint256" },
        {
          name: "collateralToDepositMin",
          type: "uint144",
          internalType: "uint144",
        },
        { name: "deadline", type: "uint40", internalType: "uint40" },
      ],
      outputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
      stateMutability: "payable",
    },
    {
      type: "function",
      name: "numberOfVaults",
      inputs: [],
      outputs: [{ name: "", type: "uint48", internalType: "uint48" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "paramsById",
      inputs: [{ name: "vaultId", type: "uint48", internalType: "uint48" }],
      outputs: [
        {
          name: "",
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
      stateMutability: "view",
    },
    {
      type: "function",
      name: "safeBatchTransferFrom",
      inputs: [
        { name: "from", type: "address", internalType: "address" },
        { name: "to", type: "address", internalType: "address" },
        { name: "vaultIds", type: "uint256[]", internalType: "uint256[]" },
        { name: "amounts", type: "uint256[]", internalType: "uint256[]" },
        { name: "data", type: "bytes", internalType: "bytes" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "safeTransferFrom",
      inputs: [
        { name: "from", type: "address", internalType: "address" },
        { name: "to", type: "address", internalType: "address" },
        { name: "vaultId", type: "uint256", internalType: "uint256" },
        { name: "amount", type: "uint256", internalType: "uint256" },
        { name: "data", type: "bytes", internalType: "bytes" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "setApprovalForAll",
      inputs: [
        { name: "operator", type: "address", internalType: "address" },
        { name: "approved", type: "bool", internalType: "bool" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "supportsInterface",
      inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }],
      outputs: [{ name: "", type: "bool", internalType: "bool" }],
      stateMutability: "pure",
    },
    {
      type: "function",
      name: "systemParams",
      inputs: [],
      outputs: [
        {
          name: "systemParams_",
          type: "tuple",
          internalType: "struct SirStructs.SystemParameters",
          components: [
            {
              name: "baseFee",
              type: "tuple",
              internalType: "struct SirStructs.FeeStructure",
              components: [
                { name: "fee", type: "uint16", internalType: "uint16" },
                { name: "feeNew", type: "uint16", internalType: "uint16" },
                {
                  name: "timestampUpdate",
                  type: "uint40",
                  internalType: "uint40",
                },
              ],
            },
            {
              name: "lpFee",
              type: "tuple",
              internalType: "struct SirStructs.FeeStructure",
              components: [
                { name: "fee", type: "uint16", internalType: "uint16" },
                { name: "feeNew", type: "uint16", internalType: "uint16" },
                {
                  name: "timestampUpdate",
                  type: "uint40",
                  internalType: "uint40",
                },
              ],
            },
            { name: "mintingStopped", type: "bool", internalType: "bool" },
            { name: "cumulativeTax", type: "uint16", internalType: "uint16" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalReserves",
      inputs: [
        { name: "collateral", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "totalSupply",
      inputs: [{ name: "vaultId", type: "uint256", internalType: "uint256" }],
      outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "unclaimedRewards",
      inputs: [
        { name: "vaultId", type: "uint256", internalType: "uint256" },
        { name: "lper", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "uint80", internalType: "uint80" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "uniswapV3SwapCallback",
      inputs: [
        { name: "amount0Delta", type: "int256", internalType: "int256" },
        { name: "amount1Delta", type: "int256", internalType: "int256" },
        { name: "data", type: "bytes", internalType: "bytes" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updateSystemState",
      inputs: [
        { name: "baseFee", type: "uint16", internalType: "uint16" },
        { name: "lpFee", type: "uint16", internalType: "uint16" },
        { name: "mintingStopped", type: "bool", internalType: "bool" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "updateVaults",
      inputs: [
        { name: "oldVaults", type: "uint48[]", internalType: "uint48[]" },
        { name: "newVaults", type: "uint48[]", internalType: "uint48[]" },
        { name: "newTaxes", type: "uint8[]", internalType: "uint8[]" },
        { name: "cumulativeTax", type: "uint16", internalType: "uint16" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "uri",
      inputs: [{ name: "vaultId", type: "uint256", internalType: "uint256" }],
      outputs: [{ name: "", type: "string", internalType: "string" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "vaultStates",
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
        {
          name: "",
          type: "tuple",
          internalType: "struct SirStructs.VaultState",
          components: [
            { name: "reserve", type: "uint144", internalType: "uint144" },
            { name: "tickPriceSatX42", type: "int64", internalType: "int64" },
            { name: "vaultId", type: "uint48", internalType: "uint48" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "vaultTax",
      inputs: [{ name: "vaultId", type: "uint48", internalType: "uint48" }],
      outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "withdrawFees",
      inputs: [{ name: "token", type: "address", internalType: "address" }],
      outputs: [
        {
          name: "totalFeesToStakers",
          type: "uint256",
          internalType: "uint256",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "withdrawToSaveSystem",
      inputs: [
        { name: "tokens", type: "address[]", internalType: "address[]" },
        { name: "to", type: "address", internalType: "address" },
      ],
      outputs: [
        { name: "amounts", type: "uint256[]", internalType: "uint256[]" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "ApprovalForAll",
      inputs: [
        {
          name: "account",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "operator",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "approved",
          type: "bool",
          indexed: false,
          internalType: "bool",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Burn",
      inputs: [
        {
          name: "vaultId",
          type: "uint48",
          indexed: true,
          internalType: "uint48",
        },
        {
          name: "burner",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        { name: "isAPE", type: "bool", indexed: false, internalType: "bool" },
        {
          name: "tokenIn",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "collateralWithdrawn",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
        {
          name: "collateralFeeToStakers",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
        {
          name: "collateralFeeToLPers",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "Mint",
      inputs: [
        {
          name: "vaultId",
          type: "uint48",
          indexed: true,
          internalType: "uint48",
        },
        {
          name: "minter",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        { name: "isAPE", type: "bool", indexed: false, internalType: "bool" },
        {
          name: "collateralIn",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
        {
          name: "collateralFeeToStakers",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
        {
          name: "collateralFeeToLPers",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
        {
          name: "tokenOut",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "ReservesChanged",
      inputs: [
        {
          name: "vaultId",
          type: "uint48",
          indexed: true,
          internalType: "uint48",
        },
        {
          name: "reserveLPers",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
        {
          name: "reserveApes",
          type: "uint144",
          indexed: false,
          internalType: "uint144",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "TransferBatch",
      inputs: [
        {
          name: "operator",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        { name: "to", type: "address", indexed: true, internalType: "address" },
        {
          name: "vaultIds",
          type: "uint256[]",
          indexed: false,
          internalType: "uint256[]",
        },
        {
          name: "amounts",
          type: "uint256[]",
          indexed: false,
          internalType: "uint256[]",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "TransferSingle",
      inputs: [
        {
          name: "operator",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "from",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        { name: "to", type: "address", indexed: true, internalType: "address" },
        {
          name: "id",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
        {
          name: "amount",
          type: "uint256",
          indexed: false,
          internalType: "uint256",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "URI",
      inputs: [
        {
          name: "value",
          type: "string",
          indexed: false,
          internalType: "string",
        },
        { name: "id", type: "uint256", indexed: true, internalType: "uint256" },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "VaultNewTax",
      inputs: [
        {
          name: "vault",
          type: "uint48",
          indexed: true,
          internalType: "uint48",
        },
        { name: "tax", type: "uint8", indexed: false, internalType: "uint8" },
        {
          name: "cumulativeTax",
          type: "uint16",
          indexed: false,
          internalType: "uint16",
        },
      ],
      anonymous: false,
    },
    { type: "error", name: "AmountTooLow", inputs: [] },
    { type: "error", name: "DeadlineExceeded", inputs: [] },
    { type: "error", name: "ExcessiveDeposit", inputs: [] },
    {
      type: "error",
      name: "InsufficientCollateralReceivedFromUniswap",
      inputs: [],
    },
    { type: "error", name: "InsufficientDeposit", inputs: [] },
    { type: "error", name: "LengthMismatch", inputs: [] },
    { type: "error", name: "Locked", inputs: [] },
    { type: "error", name: "NotAWETHVault", inputs: [] },
    { type: "error", name: "NotAuthorized", inputs: [] },
    { type: "error", name: "TEAMaxSupplyExceeded", inputs: [] },
    { type: "error", name: "TransferToZeroAddress", inputs: [] },
    { type: "error", name: "UnsafeRecipient", inputs: [] },
  ] as const,
};
