"use client";
import React, { useState } from "react";
import BurnTable from "./burnTable/burnTable";
import { Card } from "../ui/card";
import { Container } from "../ui/container";
import { UnstakeCard } from "./unstakeCard";
import ClaimCard from "./claimCard";
import { SirCard } from "./sirCard";
import ContributorClaim from "./contributorClaim";
import Explainer from "../shared/explainer";
import { EPage } from "@/lib/types";
export default function PortfolioPage() {
  const [value, setValue] = useState<"ape" | "tea" | "all">("all");
  return (
    <div className="lg:w-[900px] ">
      <div className="pt-[44px]" />
      <Explainer page={EPage.PORTFOLIO} />
      <Container className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4">
          <Card>
            <div className="flex h-full flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <h1 className="text-xl">SIR Staking</h1>
                  <h2 className="text-[14px] text-gray-400">
                    Staking sir results in...
                  </h2>
                </div>
                <ContributorClaim />
              </div>

              <SirCard />
            </div>

            <div className="pt-2" />
            {/* <ContributorClaim /> */}
          </Card>
          <Card className=" w-full px-4 py-4">
            <div className="space-y-3 ">
              <div className="grid  gap-y-3">
                {/* <SirCard /> */}
                <UnstakeCard />
                <ClaimCard />
              </div>
            </div>
          </Card>
        </div>
        <Card className="py-4">
          <div className="rounded-md bg-secondary-600 bg-opacity-40 px-4 py-2">
            <div className="flex  items-center justify-between pb-4 lg:pb-8 ">
              <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
                <span>My Tokens</span>
              </h2>
              <Slider value={value} setValue={setValue} />
            </div>
            <div className="">
              <BurnTable filter={value} />
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
      <div className="flex select-none items-center gap-x-1  rounded-full border-2 border-secondary-400">
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
      className=" w-12 cursor-pointer rounded-full px-3 py-1 text-center text-sm data-[active=true]:bg-secondary-400"
    >
      {children}
    </div>
  );
}
