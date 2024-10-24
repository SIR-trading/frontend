import { formatNumber } from "@/lib/utils";
import { CircleCheck } from "lucide-react";
import React from "react";
import { formatUnits } from "viem";

export default function TransactionSuccess({
  amountReceived,
  assetReceived,
}: {
  amountReceived?: bigint | undefined;
  assetReceived?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-center">
        <CircleCheck size={40} color="#F0C775" />
      </div>
      <h2 className="text-center">Transaction Successful!</h2>
      {amountReceived && (
        <h3 className="text-center">
          {assetReceived} received:{" "}
          {formatNumber(formatUnits(amountReceived ?? 0n, 18), 6)}
        </h3>
      )}
    </div>
  );
}
