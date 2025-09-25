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
        <Card className="p-6">
          <h2 className="flex items-center gap-x-2 pb-4 text-sm lg:pb-8">
            <FxemojiMonkeyface className="text-xl" />
            <span>My APE Tokens</span>
          </h2>
          <NoSSR
            fallback={
              <div className="flex w-full animate-fade-in flex-col gap-y-4">
                <BurnTableHeaders isApe={true} />
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
        <Card className="p-6">
          <h2 className="flex items-center gap-x-2 pb-4 text-sm lg:pb-8">
            <NotoTeapot className="text-xl" />
            <span>My TEA Tokens</span>
          </h2>
          <NoSSR
            fallback={
              <div className="flex w-full animate-fade-in flex-col gap-y-4">
                <BurnTableHeaders isApe={false} />
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
