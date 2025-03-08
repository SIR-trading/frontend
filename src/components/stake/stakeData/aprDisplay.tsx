"use client";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import Show from "@/components/shared/show";
import type { SelectCurrentApr } from "@/lib/db/schema";
import { formatNumber } from "@/lib/utils";
import React from "react";
import { formatUnits, parseUnits } from "viem";

export default function AprDisplay({
  currentApr,
}: {
  currentApr: SelectCurrentApr | undefined;
}) {
  const APR = parseUnits(currentApr?.apr ?? "0", 0);

  return (
    <div className="text-2xl font-normal ">
      <Show when={APR > 0n} fallback={<h1>N/A</h1>}>
        <h3>
          <DisplayFormattedNumber num={formatNumber(formatUnits(APR, 6))} />%
        </h3>
      </Show>
    </div>
  );
}
