"use client";
import type { ReactNode } from "react";
import PageHeadingSpace from "../shared/pageHeadingSpace";

export default function LeverageCalculatorPage({
  children,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="">
      {/* <PageHeader>{title}</PageHeader> */}
      <PageHeadingSpace />
      {/* <div className="pt-[44px]"></div> */}
      <div className="w-full">{children}</div>
    </div>
  );
}
