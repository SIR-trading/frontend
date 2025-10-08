import buildData from "@/../public/build-data.json";
import type { TAddressString } from "@/lib/types";

export const UniswapV3StakerContract = {
  address: buildData.contractAddresses.uniswapV3Staker as TAddressString,
  abi: [
    {
      type: "function",
      name: "stakes",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
        { name: "incentiveId", type: "bytes32", internalType: "bytes32" },
      ],
      outputs: [
        { name: "secondsPerLiquidityInsideInitialX128", type: "uint160", internalType: "uint160" },
        { name: "liquidity", type: "uint128", internalType: "uint128" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "deposits",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "owner", type: "address", internalType: "address" },
        { name: "numberOfStakes", type: "uint48", internalType: "uint48" },
        { name: "tickLower", type: "int24", internalType: "int24" },
        { name: "tickUpper", type: "int24", internalType: "int24" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "rewards",
      inputs: [
        { name: "rewardToken", type: "address", internalType: "contract IERC20Minimal" },
        { name: "owner", type: "address", internalType: "address" },
      ],
      outputs: [
        { name: "rewardsOwed", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "stakeToken",
      inputs: [
        {
          name: "key",
          type: "tuple",
          internalType: "struct IUniswapV3Staker.IncentiveKey",
          components: [
            { name: "rewardToken", type: "address", internalType: "contract IERC20Minimal" },
            { name: "pool", type: "address", internalType: "contract IUniswapV3Pool" },
            { name: "startTime", type: "uint256", internalType: "uint256" },
            { name: "endTime", type: "uint256", internalType: "uint256" },
            { name: "refundee", type: "address", internalType: "address" },
          ],
        },
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "unstakeToken",
      inputs: [
        {
          name: "key",
          type: "tuple",
          internalType: "struct IUniswapV3Staker.IncentiveKey",
          components: [
            { name: "rewardToken", type: "address", internalType: "contract IERC20Minimal" },
            { name: "pool", type: "address", internalType: "contract IUniswapV3Pool" },
            { name: "startTime", type: "uint256", internalType: "uint256" },
            { name: "endTime", type: "uint256", internalType: "uint256" },
            { name: "refundee", type: "address", internalType: "address" },
          ],
        },
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "claimReward",
      inputs: [
        { name: "rewardToken", type: "address", internalType: "contract IERC20Minimal" },
        { name: "to", type: "address", internalType: "address" },
        { name: "amountRequested", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "reward", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "withdrawToken",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
        { name: "to", type: "address", internalType: "address" },
        { name: "data", type: "bytes", internalType: "bytes" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getRewardInfo",
      inputs: [
        {
          name: "key",
          type: "tuple",
          internalType: "struct IUniswapV3Staker.IncentiveKey",
          components: [
            { name: "rewardToken", type: "address", internalType: "contract IERC20Minimal" },
            { name: "pool", type: "address", internalType: "contract IUniswapV3Pool" },
            { name: "startTime", type: "uint256", internalType: "uint256" },
            { name: "endTime", type: "uint256", internalType: "uint256" },
            { name: "refundee", type: "address", internalType: "address" },
          ],
        },
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "reward", type: "uint256", internalType: "uint256" },
        { name: "secondsInsideX128", type: "uint160", internalType: "uint160" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "multicall",
      inputs: [
        { name: "data", type: "bytes[]", internalType: "bytes[]" },
      ],
      outputs: [
        { name: "results", type: "bytes[]", internalType: "bytes[]" },
      ],
      stateMutability: "payable",
    },
  ] as const,
} as const;

export const NonfungiblePositionManagerContract = {
  address: buildData.contractAddresses.nftPositionManager as TAddressString,
  abi: [
    {
      type: "function",
      name: "balanceOf",
      inputs: [
        { name: "owner", type: "address", internalType: "address" },
      ],
      outputs: [
        { name: "", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "tokenOfOwnerByIndex",
      inputs: [
        { name: "owner", type: "address", internalType: "address" },
        { name: "index", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "", type: "uint256", internalType: "uint256" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "positions",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "nonce", type: "uint96", internalType: "uint96" },
        { name: "operator", type: "address", internalType: "address" },
        { name: "token0", type: "address", internalType: "address" },
        { name: "token1", type: "address", internalType: "address" },
        { name: "fee", type: "uint24", internalType: "uint24" },
        { name: "tickLower", type: "int24", internalType: "int24" },
        { name: "tickUpper", type: "int24", internalType: "int24" },
        { name: "liquidity", type: "uint128", internalType: "uint128" },
        { name: "feeGrowthInside0LastX128", type: "uint256", internalType: "uint256" },
        { name: "feeGrowthInside1LastX128", type: "uint256", internalType: "uint256" },
        { name: "tokensOwed0", type: "uint128", internalType: "uint128" },
        { name: "tokensOwed1", type: "uint128", internalType: "uint128" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "approve",
      inputs: [
        { name: "to", type: "address", internalType: "address" },
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "getApproved",
      inputs: [
        { name: "tokenId", type: "uint256", internalType: "uint256" },
      ],
      outputs: [
        { name: "", type: "address", internalType: "address" },
      ],
      stateMutability: "view",
    },
    {
      type: "function",
      name: "safeTransferFrom",
      inputs: [
        { name: "from", type: "address", internalType: "address" },
        { name: "to", type: "address", internalType: "address" },
        { name: "tokenId", type: "uint256", internalType: "uint256" },
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
        { name: "tokenId", type: "uint256", internalType: "uint256" },
        { name: "data", type: "bytes", internalType: "bytes" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
    {
      type: "function",
      name: "multicall",
      inputs: [
        { name: "data", type: "bytes[]", internalType: "bytes[]" },
      ],
      outputs: [
        { name: "results", type: "bytes[]", internalType: "bytes[]" },
      ],
      stateMutability: "payable",
    },
  ] as const,
} as const;
