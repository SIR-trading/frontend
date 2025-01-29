import { EContracts, getAddress } from "@/lib/contractAddresses";

export const OracleContract = {
  address: getAddress(EContracts.ORACLE),
  abi: [
    {
      type: "constructor",
      inputs: [
        { name: "uniswapV3Factory", type: "address", internalType: "address" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "TWAP_DURATION",
      inputs: [],
      outputs: [{ name: "", type: "uint40", internalType: "uint40" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getPrice",
      inputs: [
        { name: "collateralToken", type: "address", internalType: "address" },
        { name: "debtToken", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "int64", internalType: "int64" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "getUniswapFeeTiers",
      inputs: [],
      outputs: [
        {
          name: "uniswapFeeTiers",
          type: "tuple[]",
          internalType: "struct SirStructs.UniswapFeeTier[]",
          components: [
            { name: "fee", type: "uint24", internalType: "uint24" },
            { name: "tickSpacing", type: "int24", internalType: "int24" },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "initialize",
      inputs: [
        { name: "tokenA", type: "address", internalType: "address" },
        { name: "tokenB", type: "address", internalType: "address" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "newUniswapFeeTier",
      inputs: [{ name: "fee", type: "uint24", internalType: "uint24" }],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "state",
      inputs: [
        { name: "token0", type: "address", internalType: "address" },
        { name: "token1", type: "address", internalType: "address" },
      ],
      outputs: [
        {
          name: "",
          type: "tuple",
          internalType: "struct SirStructs.OracleState",
          components: [
            { name: "tickPriceX42", type: "int64", internalType: "int64" },
            { name: "timeStampPrice", type: "uint40", internalType: "uint40" },
            { name: "indexFeeTier", type: "uint8", internalType: "uint8" },
            {
              name: "indexFeeTierProbeNext",
              type: "uint8",
              internalType: "uint8",
            },
            {
              name: "timeStampFeeTier",
              type: "uint40",
              internalType: "uint40",
            },
            { name: "initialized", type: "bool", internalType: "bool" },
            {
              name: "uniswapFeeTier",
              type: "tuple",
              internalType: "struct SirStructs.UniswapFeeTier",
              components: [
                { name: "fee", type: "uint24", internalType: "uint24" },
                { name: "tickSpacing", type: "int24", internalType: "int24" },
              ],
            },
          ],
        },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "uniswapFeeTierOf",
      inputs: [
        { name: "tokenA", type: "address", internalType: "address" },
        { name: "tokenB", type: "address", internalType: "address" },
      ],
      outputs: [{ name: "", type: "uint24", internalType: "uint24" }],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "updateOracleState",
      inputs: [
        { name: "collateralToken", type: "address", internalType: "address" },
        { name: "debtToken", type: "address", internalType: "address" },
      ],
      outputs: [
        { name: "tickPriceX42", type: "int64", internalType: "int64" },
        {
          name: "uniswapPoolAddress",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "event",
      name: "OracleFeeTierChanged",
      inputs: [
        {
          name: "feeTierPrevious",
          type: "uint24",
          indexed: false,
          internalType: "uint24",
        },
        {
          name: "feeTierSelected",
          type: "uint24",
          indexed: false,
          internalType: "uint24",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "OracleInitialized",
      inputs: [
        {
          name: "token0",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "token1",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "feeTierSelected",
          type: "uint24",
          indexed: false,
          internalType: "uint24",
        },
        {
          name: "avLiquidity",
          type: "uint136",
          indexed: false,
          internalType: "uint136",
        },
        {
          name: "period",
          type: "uint40",
          indexed: false,
          internalType: "uint40",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "PriceUpdated",
      inputs: [
        {
          name: "token0",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "token1",
          type: "address",
          indexed: true,
          internalType: "address",
        },
        {
          name: "priceTruncated",
          type: "bool",
          indexed: false,
          internalType: "bool",
        },
        {
          name: "priceTickX42",
          type: "int64",
          indexed: false,
          internalType: "int64",
        },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "UniswapFeeTierAdded",
      inputs: [
        { name: "fee", type: "uint24", indexed: false, internalType: "uint24" },
      ],
      anonymous: false,
    },
    {
      type: "event",
      name: "UniswapOracleProbed",
      inputs: [
        { name: "fee", type: "uint24", indexed: false, internalType: "uint24" },
        {
          name: "aggPriceTick",
          type: "int56",
          indexed: false,
          internalType: "int56",
        },
        {
          name: "avLiquidity",
          type: "uint136",
          indexed: false,
          internalType: "uint136",
        },
        {
          name: "period",
          type: "uint40",
          indexed: false,
          internalType: "uint40",
        },
        {
          name: "cardinalityToIncrease",
          type: "uint16",
          indexed: false,
          internalType: "uint16",
        },
      ],
      anonymous: false,
    },
    { type: "error", name: "NoUniswapPool", inputs: [] },
    { type: "error", name: "OracleAlreadyInitialized", inputs: [] },
    { type: "error", name: "OracleNotInitialized", inputs: [] },
    { type: "error", name: "UniswapFeeTierIndexOutOfBounds", inputs: [] },
  ] as const,
};
