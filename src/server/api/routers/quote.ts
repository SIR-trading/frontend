import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { rpcViemClient } from "@/lib/viemClient";
import { OracleContract } from "@/contracts/oracle";
import type { TAddressString } from "@/lib/types";
import { UniswapV3PoolABI, UNISWAP_V3_FACTORY, FEE_TIERS } from "@/contracts/uniswap-v3-pool";
import { getAddress, keccak256, encodeAbiParameters, parseAbiParameters } from "viem";

// Helper function to compute Uniswap V3 pool address
function computePoolAddress(
  tokenA: string,
  tokenB: string,
  fee: number
): string {
  // Sort tokens
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];

  const salt = keccak256(
    encodeAbiParameters(
      parseAbiParameters("address, address, uint24"),
      [getAddress(token0), getAddress(token1), fee]
    )
  );

  const poolInitCodeHash = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";
  
  // Compute CREATE2 address
  const data = keccak256(
    `0xff${UNISWAP_V3_FACTORY.slice(2)}${salt.slice(2)}${poolInitCodeHash.slice(2)}` as `0x${string}`
  );
  
  return getAddress(`0x${data.slice(-40)}`);
}

// Helper function to convert sqrtPriceX96 to price
function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  decimals0: number,
  decimals1: number,
  token0IsInput: boolean
): number {
  const price = Number(sqrtPriceX96) ** 2 / (2 ** 192);
  const adjustedPrice = price * (10 ** decimals0) / (10 ** decimals1);
  return token0IsInput ? adjustedPrice : 1 / adjustedPrice;
}

// Export getMostLiquidPoolPrice as a standalone function for internal use
export async function getMostLiquidPoolPrice(input: {
  tokenA: string;
  tokenB: string;
  decimalsA?: number;
  decimalsB?: number;
}) {
  const feeTiers = [FEE_TIERS.LOW, FEE_TIERS.MEDIUM, FEE_TIERS.HIGH];
  let bestPool = null;
  let maxLiquidity = 0n;

  for (const fee of feeTiers) {
    try {
      const poolAddress = computePoolAddress(input.tokenA, input.tokenB, fee);
      
      // Try to read pool data
      const [slot0, liquidity] = await Promise.all([
        rpcViemClient.readContract({
          address: poolAddress as TAddressString,
          abi: UniswapV3PoolABI,
          functionName: "slot0",
        }).catch(() => null),
        rpcViemClient.readContract({
          address: poolAddress as TAddressString,
          abi: UniswapV3PoolABI,
          functionName: "liquidity",
        }).catch(() => 0n),
      ]);

      if (slot0 && liquidity > maxLiquidity) {
        maxLiquidity = liquidity;
        const [sqrtPriceX96] = slot0;
        
        const token0 = await rpcViemClient.readContract({
          address: poolAddress as TAddressString,
          abi: UniswapV3PoolABI,
          functionName: "token0",
        });

        const isToken0 = token0.toLowerCase() === input.tokenA.toLowerCase();
        const decimalsA = input.decimalsA ?? 18;
        const decimalsB = input.decimalsB ?? 18;
        
        const price = sqrtPriceX96ToPrice(
          sqrtPriceX96,
          isToken0 ? decimalsA : decimalsB,
          isToken0 ? decimalsB : decimalsA,
          isToken0
        );

        bestPool = {
          price,
          sqrtPriceX96: sqrtPriceX96.toString(),
          liquidity: liquidity.toString(),
          poolAddress,
          fee,
        };
      }
    } catch (error) {
      // Pool doesn't exist for this fee tier, continue
      continue;
    }
  }

  if (!bestPool) {
    throw new Error("No Uniswap V3 pool found for this token pair");
  }

  return bestPool;
}

export const quoteRouter = createTRPCRouter({
  // Get direct pool price from Uniswap V3
  getPoolPrice: publicProcedure
    .input(
      z.object({
        tokenA: z.string().startsWith("0x").length(42),
        tokenB: z.string().startsWith("0x").length(42),
        decimalsA: z.number().optional(),
        decimalsB: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      // Get the correct fee tier from SIR Oracle
      const oracleState = await rpcViemClient.readContract({
        ...OracleContract,
        functionName: "state",
        args: [
          input.tokenA as TAddressString,
          input.tokenB as TAddressString,
        ],
      });

      const fee = oracleState.uniswapFeeTier.fee;
      
      // Compute pool address
      const poolAddress = computePoolAddress(input.tokenA, input.tokenB, fee);
      
      // Read slot0 from the pool
      const slot0 = await rpcViemClient.readContract({
        address: poolAddress as TAddressString,
        abi: UniswapV3PoolABI,
        functionName: "slot0",
      });

      const [sqrtPriceX96] = slot0;

      // Get token order in pool
      const token0 = await rpcViemClient.readContract({
        address: poolAddress as TAddressString,
        abi: UniswapV3PoolABI,
        functionName: "token0",
      });

      const isToken0 = token0.toLowerCase() === input.tokenA.toLowerCase();
      
      // Get liquidity for confidence check
      const liquidity = await rpcViemClient.readContract({
        address: poolAddress as TAddressString,
        abi: UniswapV3PoolABI,
        functionName: "liquidity",
      });

      // Convert sqrtPriceX96 to actual price
      // Default decimals to 18 if not provided
      const decimalsA = input.decimalsA ?? 18;
      const decimalsB = input.decimalsB ?? 18;
      
      const price = sqrtPriceX96ToPrice(
        sqrtPriceX96,
        isToken0 ? decimalsA : decimalsB,
        isToken0 ? decimalsB : decimalsA,
        isToken0
      );

      return {
        price, // Price of tokenA in terms of tokenB
        sqrtPriceX96: sqrtPriceX96.toString(),
        liquidity: liquidity.toString(),
        poolAddress,
        fee,
      };
    }),

  // Find most liquid pool across common fee tiers
  getMostLiquidPoolPrice: publicProcedure
    .input(
      z.object({
        tokenA: z.string().startsWith("0x").length(42),
        tokenB: z.string().startsWith("0x").length(42),
        decimalsA: z.number().optional(),
        decimalsB: z.number().optional(),
      }),
    )
    .query(async ({ input }) => getMostLiquidPoolPrice(input)),
});