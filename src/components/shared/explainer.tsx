"use client";
import React, { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { z } from "zod";
import { EPage } from "@/lib/types";
import CloseModalButton from "../shared/closeModalButton";
import { Explainers } from "@/data/copy";
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
  const [showExplainer, setShowExplainer] = useState(false);
  useEffect(() => {
    function createExplainers() {
      setShowExplainer(true);
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
    const rawSir = window.localStorage.getItem("sir_explainers");
    try {
      const a = JSON.parse(rawSir ?? "") as unknown;
      console.log(a, "explainers");
      const parsedObject = sirExplainerLocalStorageSchema.safeParse(a);
      if (parsedObject.success) {
        const { data } = parsedObject;
        if (data[page]) {
          return;
        }
        setShowExplainer(true);
        return;
      }
      createExplainers();
    } catch {
      createExplainers();
    }
  }, [page]);
  if (!showExplainer) {
    return;
  }
  function close() {
    setShowExplainer(false);
    try {
      const rawSir = window.localStorage.getItem("sir_explainers");
      const explainerJson = JSON.parse(rawSir ?? "") as unknown;
      const parsedObject =
        sirExplainerLocalStorageSchema.safeParse(explainerJson);
      if (parsedObject.success) {
        const { data } = parsedObject;
        data[page] = true;
        window.localStorage.setItem("sir_explainers", JSON.stringify(data));
      }
    } catch {
      const explainers = {
        [EPage.LEVERAGE]: false,
        [EPage.LIQUIDITY]: false,
        [EPage.PORTFOLIO]: false,
        [EPage.AUCTIONS]: false,
        [EPage.CREATE_VAULT]: false,
        [EPage.STAKE]: false,
      };
      explainers[page] = true;
      const json = JSON.stringify(explainers);
      window.localStorage.setItem("sir_explainers", json);
    }
  }
  return (
    <div className="pb-6">
      <Card
        background="transparent"
        className="relative rounded-xl border border-white  text-black"
        style={{
          background: `linear-gradient(to right, hsl(40, 80%, 70%), hsl(265, 63%, 72%))`,
        }}
      >
        <CloseModalButton close={close} />
        <h1 className="text-[20px] font-bold">{Explainers[page].title}</h1>
        <p className="pt-2 text-[16px] font-medium leading-5">
          {Explainers[page].description}
        </p>
      </Card>
    </div>
  );
}
