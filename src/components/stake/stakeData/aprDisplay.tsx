"use client";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import Show from "@/components/shared/show";
import React from "react";

export default function AprDisplay({
  currentApr,
}: {
  currentApr: { apr: string; latestTimestamp: number } | undefined;
}) {
  const APR = parseFloat(currentApr?.apr ?? "0");

  return (
    <Show when={APR > 0} fallback={<span className="text-lg">N/A</span>}>
      <span className="text-2xl">
        <DisplayFormattedNumber num={APR} />%
      </span>
    </Show>
  );
}
