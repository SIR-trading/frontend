"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MethContract } from "@/contracts/meth";
import { TarpContract, USDTContract } from "@/contracts/tarp";
import { Copy } from "lucide-react";
import React from "react";
import { useAccount, useSimulateContract, useWriteContract } from "wagmi";

export default function Page() {
  const { address } = useAccount();
  const { data: MethData } = useSimulateContract({
    ...MethContract,
    functionName: "mint",
  });
  const { data: TarpData } = useSimulateContract({
    ...TarpContract,
    functionName: "mint",
  });
  const { data: D } = useSimulateContract({
    ...USDTContract,
    functionName: "mintFaucet",
    args: [address ?? "0x", 10000000n],
  });
  const { writeContract } = useWriteContract();
  const onSubmitMeth = () => {
    if (MethData) {
      writeContract(MethData?.request);
    }
  };

  const onSubmitTarp = () => {
    if (D) {
      writeContract(D?.request);
    }
  };
  return (
    <Container className="pt-[44px]">
      <Card className="flex  flex-col items-center justify-center bg-secondary-700 p-4 text-white">
        <h1 className="mb-6 text-2xl  ">Sepolia Utilities</h1>

        <div className="flex gap-x-3 text-accent-100">
          <a
            href="https://www.infura.io/faucet/sepolia"
            target="_blank"
            className="rounded px-4 py-2"
          >
            Mint ETH
          </a>
          <a
            href="https://faucets.chain.link/sepolia"
            target="_blank"
            className="rounded  px-4 py-2"
          >
            Mint LINK
          </a>
          <a
            href="https://faucet.circle.com/"
            target="_blank"
            className="rounded  px-4 py-2"
          >
            Mint USDC
          </a>
        </div>

        <div className="mt-8 rounded-lg bg-secondary-400 bg-opacity-40 p-6 shadow-md ">
          <h2 className="mb-4 text-lg text-gray-200">Mock Tokens</h2>
          <div className="flex justify-between ">
            <div className="">
              <Button
                disabled={!MethData}
                onClick={() => {
                  onSubmitMeth();
                }}
                className="mt-2 rounded  px-4 py-2  "
              >
                Mint 1000 METH
              </Button>
            </div>

            <div className="mb-4">
              <Button
                disabled={!TarpData}
                onClick={() => {
                  onSubmitTarp();
                }}
                className="mt-2 rounded  px-4 py-2  "
              >
                Mint 1000 TARP
              </Button>
            </div>
          </div>
          <div>
            <h3 className="py-2 text-center text-lg text-gray-200">
              Token Info
            </h3>
            <div className=" ">
              <div>
                <h3 className="pb-2 text-lg text-gray-200">METH</h3>
                <div className="">
                  <Row title="Symbol" value="METH" />
                  <Row
                    copy
                    title="Address"
                    value="0x7Aef48AdbFDc1262161e71Baf205b47316430067"
                  />
                </div>
              </div>

              <div>
                <h3 className="pb-2 text-lg  text-gray-200">TARP</h3>
                <div className="">
                  <Row title="Symbol" value="TARP" />
                  <Row
                    copy
                    title="Address"
                    value="0x3ED05DE92879a5D47a3c8cc402DD5259219505aD"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <a
          href="https://interface-jet.vercel.app/#/swap?chain=sepolia"
          target="_blank"
          className="mt-8 rounded bg-gold px-4 py-2 text-black  hover:bg-gold/95"
        >
          Trade on Sepolia Uniswap
        </a>
      </Card>
    </Container>
  );
}
function Row({
  title,
  value,
  copy,
}: {
  copy?: boolean;
  title: string;
  value: string;
}) {
  return (
    <div className="flex  justify-between gap-x-4">
      <h3 className="text-gray-400">{title}</h3>
      <div className="flex items-center gap-x-1">
        <h4 className="text-sm">{value}</h4>

        {copy && (
          <Copy
            size={16}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
              } catch {} //let it fail silently
            }}
            className="cursor-pointer text-gray-400"
          />
        )}
      </div>
    </div>
  );
}
