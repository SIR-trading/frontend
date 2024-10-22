import React from "react";
import { Container } from "../ui/container";
import { Card } from "../ui/card";

export default function PorfolioSkeleton() {
  return (
    <div className="lg:w-[1000px] ">
      <div className="pt-[44px]"></div>
      <Container className="space-y-4">
        <Card className=" flex h-[250px] w-full flex-col justify-between px-4 py-4">
          <div className="space-y-3 ">
            <TitleSkeleton />
            <div className="grid grid-cols-2 gap-x-3  pt-2"></div>
          </div>
          <div className="flex gap-x-2">
            <div className="h-[76px] w-full animate-pulse rounded-md bg-gray-800"></div>
            <div className="h-[76px] w-full animate-pulse rounded-md bg-gray-800"></div>
          </div>
        </Card>
        <Card className="h-[210px] py-4">
          <div className="h-full w-full animate-pulse rounded-md bg-gray-800"></div>
        </Card>
      </Container>
    </div>
  );
}

function TitleSkeleton() {
  return (
    <div className="mb-2 h-[16px] w-[30px] animate-pulse rounded-md bg-gray-800/70"></div>
  );
}
