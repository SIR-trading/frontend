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
    <div className="py-3">
      <div className="flex flex-col gap-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground/70">Long</span>

          {isLoading && <TextSkele />}
          {!isLoading && (
            <div className="flex items-center gap-x-2">
              <TokenImage
                address={longToken as TAddressString}
                alt={symbols?.[0]?.result ?? ""}
                width={25}
                height={25}
                className="rounded-full"
              />
              <span className="text-base font-medium text-foreground">
                {symbols?.[0]?.result ?? "Unknown"}
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground/70">Versus</span>
          {isLoading && <TextSkele />}
          {!isLoading && (
            <div className="flex items-center gap-x-2">
              <TokenImage
                address={versusToken as TAddressString}
                alt={symbols?.[1]?.result ?? ""}
                width={25}
                height={25}
                className="rounded-full"
              />
              <span className="text-base font-medium text-foreground">
                {symbols?.[1]?.result ?? "Unknown"}
              </span>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground/70">Leverage</span>
          <span className="text-base font-medium text-foreground">
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
