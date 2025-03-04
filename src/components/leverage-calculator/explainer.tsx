"use client";
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { z } from "zod";
import { EPage } from "@/lib/types";
const sirExplainerLocalStorageSchema = z.object({
  [EPage.LEVERAGE]: z.boolean(),
  [EPage.LIQUIDITY]: z.boolean(),
  [EPage.PORTFOLIO]: z.boolean(),
  [EPage.STAKE]: z.boolean(),
  [EPage.AUCTIONS]: z.boolean(),
  [EPage.CREATE_VAULT]: z.boolean(),
});
interface Props {
  page: EPage;
}

export default function Explainer({ page }: Props) {
  const [showExpaliner, setShowExplainer] = useState(false);
  useEffect(() => {
    function createExplainers() {
      const explainers = {
        [EPage.LEVERAGE]: false,
        [EPage.LIQUIDITY]: false,
        [EPage.PORTFOLIO]: false,
        [EPage.AUCTIONS]: false,
        [EPage.CREATE_VAULT]: false,
        [EPage.STAKE]: false,
      };
      const json = JSON.stringify(explainers);
      window.localStorage.setItem("sir_explainers", json);
    }
    const rawSir = window.localStorage.getItem("sir_explainer");
    try {
      const a = JSON.parse(rawSir ?? "") as unknown;
      const parsedObject = sirExplainerLocalStorageSchema.safeParse(a);
      if (parsedObject.success) {
        const { data } = parsedObject;
        if (data[page]) {
          return;
        } else {
          setShowExplainer(true);
          return;
        }
      } else {
        createExplainers();
      }
    } catch {
      createExplainers();
    }
  }, [page]);
  if (!showExpaliner) {
    return;
  }
  return (
    <div className="pb-10">
      <Card className="rounded-xl border border-white bg-gradient-to-r from-gold to-purple text-black">
        <h1 className="text-[20px] font-bold">Take on Leverage</h1>
        <p className="pt-2 text-[16px] font-medium leading-5">
          SIR provides constant leverage without typical downsides. Compound
          gains as prices rise, with no maintenance fees, volatility decay, or
          liquidations. Pay fees only when opening or closing positions (minting
          or burning APE), enabling long-term leveraged investing.
        </p>
      </Card>
    </div>
  );
}
