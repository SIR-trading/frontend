"use client";
import { formatSmallNumber } from "@/lib/utils";
import React, { useMemo } from "react";

export default function Page() {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col gap-4 rounded-md bg-black p-4 ">
        <span className="text-md ">
          <DisplaySmallNumber num={formatSmallNumber(0.00031)} />
        </span>
        <span>
          <DisplaySmallNumber num={formatSmallNumber(0.0000312222)} />
        </span>
      </div>
    </div>
  );
}

function DisplaySmallNumber({ num }: { num: string }) {
  const { sig, exp } = useMemo(() => {
    if (num.includes("v")) {
      const split = num.split("v")[1];
      if (!split) return { sig: "0", exp: 0 };
      return { sig: split.slice(1, split.length), exp: split[0] };
    }
    return { sig: "0", exp: 0 };
  }, [num]);
  if (!num.includes("v")) {
    return num;
  }
  return (
    <>
      0.0
      <sub className="text-[11px]">+{exp}</sub>
      {sig}
    </>
  );
}
