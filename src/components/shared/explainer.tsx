// components/Explainer.tsx
"use client";
import React from "react";
import type { EPage } from "@/lib/types";
import { Explainers } from "@/data/explainers";

interface Props {
  page: EPage;
}

export default function Explainer({ page }: Props) {
  const explainer = Explainers[page]
  if (!explainer) return null

  return (
    <div className="w-full pb-8">
      <h1 className="text-[24px] font-semibold md:text-[32px] lg:text-[42px]">
        {explainer.title}
      </h1>
      <div className="pt-2 text-[16px] leading-5 opacity-75 [&>p+p]:mt-4">
        {explainer.description}
      </div>
    </div>
  );
}
