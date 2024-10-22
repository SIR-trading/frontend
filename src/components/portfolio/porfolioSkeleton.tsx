import React from "react";
import { Container } from "../ui/container";
import { Card } from "../ui/card";

export default function PorfolioSkeleton() {
  return (
    <div className="lg:w-[1000px] ">
      <div className="pt-[44px]"></div>
      <Container className="space-y-4">
        <Card className=" w-full px-4 py-4">
          <div className="space-y-3 ">
            <div className="grid grid-cols-2 gap-x-3  pt-2"></div>
          </div>
        </Card>
        <Card className="py-4">
          <div className="rounded-md bg-secondary-400 px-4 py-2">
            <div className="flex  items-center justify-between pb-4 lg:pb-8 ">
              <h2 className="flex items-center gap-x-1 pb-1 text-sm text-gray-200 ">
                <span>My Tokens</span>
              </h2>
              {/* <Slider value={value} setValue={setValue} /> */}
            </div>
            <div className="">{/* <BurnTable filter={value} /> */}</div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
