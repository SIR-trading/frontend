import React from "react";
import { TokenImage } from "../shared/TokenImage";
import { mapLeverage } from "@/lib/utils/index";
import type { TAddressString } from "@/lib/types";
import { useReadContracts } from "wagmi";
import { erc20Abi } from "viem";

export default function TransactionInfoCreateVault({
  leverageTier,
  longToken,
  versusToken,
}: {
  leverageTier: string;
  longToken: string;
  versusToken: string;
}) {
  const { data: symbols, isLoading } = useReadContracts({
    contracts: [
      {
        address: longToken as TAddressString,
        abi: erc20Abi,
        functionName: "symbol",
      },
      {
        address: versusToken as TAddressString,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
  });

  return (
    <div className="py-3 ">
      <div className="flex flex-col gap-y-2">
        <div className=" flex  justify-between gap-y-1">
          <span className="text-gray-300 text-[12px]">Long</span>

          {isLoading && <TextSkele />}
          {!isLoading && (
            <div className="flex items-center gap-x-1">
              <span className="text-[14px] text-foreground/80">
                {symbols?.[0]?.result ?? "Unknown"}
              </span>

              <TokenImage
                address={longToken as TAddressString}
                alt={symbols?.[0]?.result ?? ""}
                width={20}
                height={20}
                className="rounded-full"
              />
            </div>
          )}
        </div>
        <div className=" flex  justify-between gap-y-1">
          <span className="text-gray-300 text-[12px]">Versus</span>
          {isLoading && <TextSkele />}
          {!isLoading && (
            <div className="flex items-center gap-x-1">
              <span className="text-[14px] text-foreground/80">
                {symbols?.[1]?.result ?? "Unknown"}
              </span>

              <TokenImage
                address={versusToken as TAddressString}
                alt={symbols?.[1]?.result ?? ""}
                width={20}
                height={20}
                className="rounded-full"
              />
            </div>
          )}
        </div>
        <div className="flex justify-between gap-y-1">
          <span className="text-gray-300 text-[12px]">Leverage</span>
          <span className="leading-0 text-center text-[14px] ">
            ^{mapLeverage(leverageTier)}
          </span>
        </div>
      </div>
    </div>
  );
}

function TextSkele() {
  return (
    <div className="animate-pulse rounded-sm bg-foreground/10 text-[14px] text-transparent">
      USD Coin
    </div>
  );
}
