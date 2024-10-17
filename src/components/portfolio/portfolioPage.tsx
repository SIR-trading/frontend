"use client";
import React, { useState } from "react";
import BurnTable from "./burnTable/burnTable";
import { Card } from "../ui/card";
import { Container } from "../ui/container";
// import PageHeader from "../shared/pageHeader";
import { StakedCard } from "./stakedCard";
import ClaimCard from "./claimCard";
import { SirCard } from "./sirCard";

export default function PortfolioPage() {
  const [value, setValue] = useState<"ape" | "tea" | "all">("all");
  return (
    <div className="lg:w-[1000px] xl:w-[1250px]">
      <div className="pt-[44px]"></div>
      <Container>
        <Card className=" w-full px-4">
          <div className="space-y-3 ">
            <SirCard />
            <div className="grid grid-cols-2 gap-x-3  pt-2">
              {/* <SirCard /> */}
              <StakedCard />
              <ClaimCard />
            </div>
          </div>
          <div className="pt-8"></div>
          <div className="rounded-md bg-secondary-400 px-4 py-2">
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
      <div className="flex items-center gap-x-1  rounded-full border border-secondary-100">
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
      className=" w-12 cursor-pointer rounded-full px-3 py-1 text-center text-sm data-[active=true]:bg-secondary-100"
    >
      {children}
    </div>
  );
}
