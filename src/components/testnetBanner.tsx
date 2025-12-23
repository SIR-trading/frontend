"use client";

import { env } from "@/env";
import { useWriteContract, useAccount } from "wagmi";
import { Button } from "./ui/button";
import { useState } from "react";
import { AlertTriangle, Coins, Copy, Check } from "lucide-react";

const MOCK_TOKEN_A = "0x4460D83f91A224B2856F2103BAfd5B1076Dc58C8";
const MOCK_TOKEN_B = "0xFDd3f0d6E5f400e8a6E2D6337716aeEedb2D6201";

const MOCK_TOKEN_ABI = [
  {
    type: "function",
    name: "mint",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;

export default function TestnetBanner() {
  const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
  const { isConnected } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [mintingToken, setMintingToken] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  // Only show on MegaETH testnet
  if (chainId !== 6343) {
    return null;
  }

  const handleMint = (tokenAddress: string) => {
    setMintingToken(tokenAddress);
    writeContract(
      {
        address: tokenAddress as `0x${string}`,
        abi: MOCK_TOKEN_ABI,
        functionName: "mint",
      },
      {
        onSettled: () => setMintingToken(null),
      }
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 mb-4">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg bg-amber-500/20 dark:bg-amber-600/20 border border-amber-500/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">
            TESTNET
          </span>
          <span className="text-sm text-amber-600/80 dark:text-amber-400/80">
            - Tokens have no real value
          </span>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/60 hidden sm:inline">|</span>
            <span className="text-xs text-foreground/60 hidden sm:inline">Mint test tokens:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={() => handleMint(MOCK_TOKEN_A)}
                disabled={isPending && mintingToken === MOCK_TOKEN_A}
                className="h-7 text-xs py-1"
              >
                <Coins className="h-3 w-3 mr-1" />
                Mock Token A
              </Button>
              <button
                onClick={() => handleCopy(MOCK_TOKEN_A)}
                className="p-1 rounded hover:bg-foreground/10 transition-colors"
                title="Copy address"
              >
                {copiedAddress === MOCK_TOKEN_A ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-foreground/60" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={() => handleMint(MOCK_TOKEN_B)}
                disabled={isPending && mintingToken === MOCK_TOKEN_B}
                className="h-7 text-xs py-1"
              >
                <Coins className="h-3 w-3 mr-1" />
                Mock Token B
              </Button>
              <button
                onClick={() => handleCopy(MOCK_TOKEN_B)}
                className="p-1 rounded hover:bg-foreground/10 transition-colors"
                title="Copy address"
              >
                {copiedAddress === MOCK_TOKEN_B ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-foreground/60" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
