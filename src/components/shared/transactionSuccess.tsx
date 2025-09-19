import { CircleCheck } from "lucide-react";
import React from "react";
import type { Address } from "viem";
import { formatUnits } from "viem";
import ExplorerLink from "./explorerLink";
import { motion } from "motion/react";
import { TokenImage } from "./TokenImage";
import DisplayFormattedNumber from "./displayFormattedNumber";

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
        <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
      </div>
      <h2 className="text-center">Transaction Successful!</h2>
      {amountReceived && (
        <div className="flex justify-center items-center gap-x-2">
          <span className="text-xl">
            <DisplayFormattedNumber num={formatUnits(amountReceived ?? 0n, decimals ?? 18)} significant={6} />
          </span>
          <div className="flex items-center gap-x-2">
            {assetAddress && (
              <TokenImage
                className="rounded-full"
                alt={assetReceived ?? ""}
                width={24}
                height={24}
                address={assetAddress}
              />
            )}
            <span className="text-xl text-muted-foreground">{assetReceived}</span>
          </div>
        </div>
      )}
      <ExplorerLink transactionHash={hash} />
    </motion.div>
  );
}
