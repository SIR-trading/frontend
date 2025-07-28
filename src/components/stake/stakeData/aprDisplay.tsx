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
    <div className="text-2xl font-normal ">
      <Show when={APR > 0} fallback={<h1>N/A</h1>}>
        <h3>
          <DisplayFormattedNumber num={APR} />%
        </h3>
      </Show>
    </div>
  );
}
