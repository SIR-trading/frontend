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
export default function PortfolioPage() {
  return (
    <div className="lg:w-[900px] ">
      <PageHeadingSpace />
      {/* <div className="pt-[44px]" /> */}
      <Container className="space-y-4">
        <Explainer page={EPage.PORTFOLIO} />

        {/* APE Tokens Section */}
        <Card className="p-4">
          <h2 className="flex items-center gap-x-1 pb-4 lg:pb-8 text-sm">
            My APE Tokens
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
          <h2 className="flex items-center gap-x-1 pb-4 lg:pb-8 text-sm">
            My TEA Tokens
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
