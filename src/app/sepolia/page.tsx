import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import React from "react";

export default function Page() {
  return (
    <Container>
      <Card className="flex min-h-screen flex-col items-center justify-center  p-4">
        <h1 className="mb-6 text-3xl font-bold text-white">
          Sepolia Testnet Faucet e & Token Interaction
        </h1>

        <div className="space-y-4">
          <a
            href="https://www.infura.io/faucet/sepolia"
            target="_blank"
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Mint ETH
          </a>
          <a
            href="https://faucets.chain.link/sepolia"
            target="_blank"
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Mint LINK
          </a>
          <a
            href="https://faucet.circle.com/"
            target="_blank"
            className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
          >
            Mint USDC
          </a>
        </div>

        <div className="mt-8 w-full max-w-md rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Token Details</h2>

          <div className="mb-4">
            <p>
              <strong>Name:</strong> Token A
            </p>
            <p>
              <strong>Symbol:</strong> TKA
            </p>
            <p>
              <strong>Address:</strong> 0x123...abc
            </p>
            <button className="mt-2 rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700">
              Mint 1000 TKA
            </button>
          </div>

          <div className="mb-4">
            <p>
              <strong>Name:</strong> Token B
            </p>
            <p>
              <strong>Symbol:</strong> TKB
            </p>
            <p>
              <strong>Address:</strong> 0x456...def
            </p>
            <button className="mt-2 rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700">
              Mint 1000 TKB
            </button>
          </div>
        </div>

        <a
          href="https://interface-jet.vercel.app/#/swap?chain=sepolia"
          target="_blank"
          className="mt-8 rounded bg-purple-500 px-4 py-2 font-bold text-white hover:bg-purple-700"
        >
          Trade on Sepolia Uniswap
        </a>
      </Card>
    </Container>
  );
}
