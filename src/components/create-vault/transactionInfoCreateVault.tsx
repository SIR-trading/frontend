import React from "react";
import ImageWithFallback from "../shared/ImageWithFallback";
import { mapLeverage } from "@/lib/utils";
import type { TAddressString } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { tokenSchema } from "@/lib/schemas";
import { getLogoAsset, getLogoJson } from "@/lib/assets";

export default function TransactionInfoCreateVault({
  leverageTier,
  longToken,
  versusToken,
}: {
  leverageTier: string;
  longToken: string;
  versusToken: string;
}) {
  const { data: versusTokenData, isFetching } = useQuery({
    queryKey: ["versus"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const resp = await fetch(getLogoJson(versusToken as TAddressString)).then(
        (r) => r.json(),
      );
      const result = tokenSchema.safeParse(resp);
      console.log(result, "RESULT");
      return result;
    },
  });

  const { data: longTokenData, isFetching: isFetchingLong } = useQuery({
    queryKey: ["longtoken"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const resp = await fetch(getLogoJson(longToken as TAddressString)).then(
        (r) => r.json(),
      );
      const result = tokenSchema.safeParse(resp);
      return result;
    },
  });

  return (
    <div className="py-3 ">
      <div className="flex flex-col gap-y-2">
        <div className=" flex  justify-between gap-y-1">
          <span className="text-gray-300 text-[12px]">Long</span>

          {isFetchingLong && <TextSkele />}
          {!isFetchingLong && (
            <div className="flex items-center gap-x-1">
              <span className="text-[14px] text-foreground/80">
                {longTokenData?.success ? longTokenData.data.symbol : "Unknown"}
              </span>

              <ImageWithFallback
                alt={longTokenData?.success ? longTokenData.data.symbol : ""}
                src={getLogoAsset(longToken as TAddressString)}
                width={20}
                height={20}
              />
            </div>
          )}
        </div>
        <div className=" flex  justify-between gap-y-1">
          <span className="text-gray-300 text-[12px]">Versus</span>
          {isFetching && <TextSkele />}
          {!isFetching && (
            <div className="flex items-center gap-x-1">
              <span className="text-[14px] text-foreground/80">
                {versusTokenData?.success
                  ? versusTokenData.data.symbol
                  : "unknown"}
              </span>

              <ImageWithFallback
                width={20}
                height={20}
                alt={
                  versusTokenData?.success ? versusTokenData.data.symbol : ""
                }
                src={getLogoAsset(versusToken as TAddressString)}
              />
            </div>
          )}
        </div>
        <div className="flex justify-between gap-y-1">
          <span className="text-gray-300 text-[12px]">Leverage</span>
          <span className="leading-0 text-center text-[14px] ">
            {mapLeverage(leverageTier)}x
          </span>
        </div>
      </div>
    </div>
  );
}

function TextSkele() {
  return (
    <div className="bg-foreground/10text-[14px] animate-pulse rounded-sm text-transparent">
      USD Coin
    </div>
  );
}
