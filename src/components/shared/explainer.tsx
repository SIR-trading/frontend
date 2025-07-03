"use client";
import React from "react";
import { Card } from "../ui/card";
// import { z } from "zod";
import type { EPage } from "@/lib/types";
import CloseModalButton from "../shared/closeModalButton";
import { Explainers } from "@/data/copy";
// const sirExplainerLocalStorageSchema = z.object({
//   [EPage.LEVERAGE]: z.boolean(),
//   [EPage.LIQUIDITY]: z.boolean(),
//   [EPage.PORTFOLIO]: z.boolean(),
//   [EPage.STAKE]: z.boolean(),
//   [EPage.AUCTIONS]: z.boolean(),
//   [EPage.CREATE_VAULT]: z.boolean(),
// });
interface Props {
  page: EPage;
}

export default function Explainer({ page }: Props) {
  // const [showExplainer, setShowExplainer] = useState(false);
  // useEffect(() => {
  //   function createExplainers() {
  //     setShowExplainer(true);
  //     const explainers = {
  //       [EPage.LEVERAGE]: false,
  //       [EPage.LIQUIDITY]: false,
  //       [EPage.PORTFOLIO]: false,
  //       [EPage.AUCTIONS]: false,
  //       [EPage.CREATE_VAULT]: false,
  //       [EPage.STAKE]: false,
  //     };
  //     const json = JSON.stringify(explainers);
  //     window.localStorage.setItem("sir_explainers", json);
  //   }
  //   const rawSir = window.localStorage.getItem("sir_explainers");
  //   try {
  //     const a = JSON.parse(rawSir ?? "") as unknown;
  //     console.log(a, "explainers");
  //     const parsedObject = sirExplainerLocalStorageSchema.safeParse(a);
  //     if (parsedObject.success) {
  //       const { data } = parsedObject;
  //       if (data[page]) {
  //         return;
  //       }
  //       setShowExplainer(true);
  //       return;
  //     }
  //     createExplainers();
  //   } catch {
  //     createExplainers();
  //   }
  // }, [page]);
  // if (!showExplainer) {
  //   return;
  // }
  // function close() {
  //   setShowExplainer(false);
  //   try {
  //     const rawSir = window.localStorage.getItem("sir_explainers");
  //     const explainerJson = JSON.parse(rawSir ?? "") as unknown;
  //     const parsedObject =
  //       sirExplainerLocalStorageSchema.safeParse(explainerJson);
  //     if (parsedObject.success) {
  //       const { data } = parsedObject;
  //       data[page] = true;
  //       window.localStorage.setItem("sir_explainers", JSON.stringify(data));
  //     }
  //   } catch {
  //     const explainers = {
  //       [EPage.LEVERAGE]: false,
  //       [EPage.LIQUIDITY]: false,
  //       [EPage.PORTFOLIO]: false,
  //       [EPage.AUCTIONS]: false,
  //       [EPage.CREATE_VAULT]: false,
  //       [EPage.STAKE]: false,
  //     };
  //     explainers[page] = true;
  //     const json = JSON.stringify(explainers);
  //     window.localStorage.setItem("sir_explainers", json);
  //   }
  // }
  return (
    <div className="w-full pb-8">
      <h1 className="text-[24px] font-semibold md:text-[32px] lg:text-[42px]">
        {Explainers[page].title}
      </h1>
      <p className="whitespace-pre-wrap pt-2 text-[16px] leading-5 opacity-75 [&>p+p]:mt-2">
        {Explainers[page].description.split("\n").map((line, index) => (
          <p key={index} className={index > 0 ? "mt-4" : ""}>
            {line}
          </p>
        ))}
      </p>
    </div>
  );
}
