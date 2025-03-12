import { formatNumber } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import React from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import ExplorerLink from "./explorerLink";
import { motion } from "motion/react";
import ImageWithFallback from "./ImageWithFallback";
import { getLogoAsset } from "@/lib/assets";

export default function TransactionSuccess({
  amountReceived,
  assetReceived,
  assetAddress,
  hash,
  decimals,
}: {
  amountReceived?: bigint | undefined;
  assetAddress?: Address;
  assetReceived?: string;
  decimals?: number;
  hash: string | undefined;
}) {
  return (
    <motion.div
      initial={{ opacity: 0.2 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-2"
    >
      <div className="flex justify-center">
        <CircleCheck size={40} color="#F0C775" />
      </div>
      <h2 className="text-center">Transaction Successful!</h2>
      {amountReceived && (
        <div className="flex justify-center gap-x-2">
          <div className="flex items-center justify-center gap-x-1">
            {assetAddress && (
              <ImageWithFallback
                className="h-5 w-5 rounded-full"
                alt={assetReceived ?? ""}
                width={24}
                height={24}
                src={getLogoAsset(assetAddress)}
              />
            )}
            {assetReceived}{" "}
          </div>
          <div>
            {formatNumber(formatUnits(amountReceived ?? 0n, decimals ?? 18), 6)}
          </div>
        </div>
      )}
      <ExplorerLink transactionHash={hash} />
    </motion.div>
  );
}
