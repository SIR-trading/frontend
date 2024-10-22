import React from "react";
import { Container } from "../ui/container";
import { Card } from "../ui/card";
import LeverageLiquidityPage from "./leverageLiquidityPage";

export default function LeverageLiquiditySkeleton() {
  return (
    <main className="flex flex-col items-center justify-center text-white">
      <LeverageLiquidityPage title={"Take on Leverage"}>
        <Container>
          <div className="grid w-full gap-x-[16px] gap-y-4 xl:grid-cols-2">
            {/* MintForm */}
            <Card className="h-[550px] w-full space-y-4">
              <div className=" grid gap-x-4 md:grid-cols-3">
                <SelectSkeleton />
                <SelectSkeleton />
                <SelectSkeleton />
              </div>
              <div>
                <TitleSkeleton />
                <div className="h-[133px] w-full animate-pulse rounded-md bg-gray-800"></div>
              </div>
              <div>
                <TitleSkeleton />
                <div className="h-[52px] w-full animate-pulse rounded-md bg-gray-800"></div>
              </div>
              <div className="flex w-full justify-center pt-6">
                <div className=" h-[40px] w-[450px] animate-pulse rounded-md bg-gray-800"></div>
              </div>
            </Card>
            {/* VaultTable */}
            <Card>
              <div className="flex h-full flex-col ">
                <div className="w-full text-center">
                  <div className="flex justify-center">
                    <div className="animate-pulse select-none rounded-md bg-gray-800/60 font-lora text-[32px] font-bold text-transparent">
                      POPULAR VAULTS
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <div className="h-[20px] w-full animate-pulse rounded-md bg-gray-800/70"></div>
                </div>
                <div className="space-y-3 pt-4">
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                  <RowSkeleton />
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </LeverageLiquidityPage>
    </main>
  );
}
function RowSkeleton() {
  return (
    <div className="h-[28px] w-full animate-pulse rounded-md bg-gray-800"></div>
  );
}
function TitleSkeleton() {
  return (
    <div className="mb-2 h-[16px] w-[30px] animate-pulse rounded-md bg-gray-800/70"></div>
  );
}
function SelectSkeleton() {
  return (
    <div>
      <TitleSkeleton />
      <div className="h-[40px] animate-pulse rounded-md bg-gray-800"></div>
    </div>
  );
}
