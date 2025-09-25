"use client";
import React from "react";
import BurnTable from "./burnTable/burnTable";
import BurnTableRowSkeleton from "./burnTable/burnTableRowSkeleton";
import BurnTableHeaders from "./burnTable/burnTableHeader";
import { Card } from "../ui/card";
import { Container } from "../ui/container";
import NoSSR from "../ui/no-ssr";
import Explainer from "../shared/explainer";
import { EPage } from "@/lib/types";
import PageHeadingSpace from "../shared/pageHeadingSpace";
import { FxemojiMonkeyface } from "../ui/icons/monkey-icon";
import { NotoTeapot } from "../ui/icons/teapot-icon";
export default function PortfolioPage() {
  return (
    <div className="lg:w-[900px] ">
      <PageHeadingSpace />
      {/* <div className="pt-[44px]" /> */}
      <Container className="space-y-4">
        <Explainer page={EPage.PORTFOLIO} />

        {/* APE Tokens Section */}
        <Card className="p-4">
          <h2 className="flex items-center gap-x-2 pb-4 lg:pb-8 text-sm">
            <FxemojiMonkeyface className="text-xl" />
            <span>My APE Tokens</span>
          </h2>
          <NoSSR
            fallback={
              <div className="w-full animate-fade-in flex flex-col gap-y-4">
                <BurnTableHeaders />
                <BurnTableRowSkeleton />
                <BurnTableRowSkeleton />
                <BurnTableRowSkeleton />
              </div>
            }
          >
            <BurnTable filter="ape" />
          </NoSSR>
        </Card>

        {/* TEA Tokens Section */}
        <Card className="p-4">
          <h2 className="flex items-center gap-x-2 pb-4 lg:pb-8 text-sm">
            <NotoTeapot className="text-xl" />
            <span>My TEA Tokens</span>
          </h2>
          <NoSSR
            fallback={
              <div className="w-full animate-fade-in flex flex-col gap-y-4">
                <BurnTableHeaders />
                <BurnTableRowSkeleton />
                <BurnTableRowSkeleton />
                <BurnTableRowSkeleton />
              </div>
            }
          >
            <BurnTable filter="tea" />
          </NoSSR>
        </Card>
      </Container>
    </div>
  );
}
