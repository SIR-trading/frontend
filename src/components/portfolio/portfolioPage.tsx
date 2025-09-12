"use client";
import React, { useState } from "react";
import BurnTable from "./burnTable/burnTable";
import BurnTableRowSkeleton from "./burnTable/burnTableRowSkeleton";
import BurnTableHeaders from "./burnTable/burnTableHeader";
import { Card } from "../ui/card";
import { Container } from "../ui/container";
import NoSSR from "../ui/no-ssr";
import { UnstakeCard } from "./unstakeCard";

import { SirCard } from "./sirCard";
import ContributorClaim from "./contributorClaim";
import Explainer from "../shared/explainer";
import { EPage } from "@/lib/types";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import ClaimCard from "../shared/claimCard";
import { getNativeCurrencySymbol } from "@/lib/chains";
export default function PortfolioPage() {
  const [value, setValue] = useState<"ape" | "tea" | "all">("all");
  return (
    <div className="lg:w-[900px] ">
      <PageHeadingSpace />
      {/* <div className="pt-[44px]" /> */}
      <Container className="space-y-4">
        <Explainer page={EPage.PORTFOLIO} />
        <Card className="w-full">
          <div className="grid gap-4 md:grid-cols-2 h-full">
            <div className="flex flex-col justify-between h-full">
              <div className="rounded-md p-2 pb-2">
                <div className="flex justify-between rounded-md text-2xl">
                  <div className="flex gap-x-2">
                    <div className="flex w-full justify-between">
                      <div>
                        <div className="text-sm">
                          <p>Stake your SIR to earn {getNativeCurrencySymbol()} dividends.</p>
                        </div>
                        <div className="pt-2">
                          <ContributorClaim />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <SirCard />
            </div>
            <div className="grid gap-y-3 h-full">
              <div className="h-full">
                <UnstakeCard />
              </div>
              <div className="h-full">
                <ClaimCard />
              </div>
            </div>
          </div>
        </Card>
        <Card className="py-4">
          <div className="rounded-md bg-primary/5 px-4 py-2 dark:bg-primary">
            <div className="flex  items-center justify-between pb-4 lg:pb-8 ">
              <h2 className="flex items-center gap-x-1 pb-1 text-sm">
                <span>My Tokens</span>
              </h2>
              <Slider value={value} setValue={setValue} />
            </div>
            <div className="">
              <NoSSR 
                fallback={
                  <div className="w-full animate-fade-in">
                    <div className="flex flex-col gap-y-4">
                      <BurnTableHeaders />
                      <BurnTableRowSkeleton />
                      <BurnTableRowSkeleton />
                      <BurnTableRowSkeleton />
                    </div>
                  </div>
                }
              >
                <BurnTable filter={value} />
              </NoSSR>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
function Slider({
  value,
  setValue,
}: {
  value: "ape" | "tea" | "all";
  setValue: (a: "ape" | "tea" | "all") => void;
}) {
  return (
    <div>
      <div className="flex select-none items-center gap-x-1  rounded-full border-2 border-foreground/20">
        <Slide active={value === "all"} onClick={() => setValue("all")}>
          All
        </Slide>
        <Slide active={value === "ape"} onClick={() => setValue("ape")}>
          APE
        </Slide>
        <Slide onClick={() => setValue("tea")} active={value === "tea"}>
          TEA
        </Slide>
      </div>
    </div>
  );
}

function Slide({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      data-active={active ? "true" : ""}
      className=" w-12 cursor-pointer rounded-full px-3 py-1 text-center text-sm data-[active=true]:bg-foreground/20"
    >
      {children}
    </div>
  );
}
