"use client";
import React from "react";
import AprDisplay from "./aprDisplay";
import { api } from "@/trpc/react";
import ToolTip from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";

export default function AprCard() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: apr, isLoading } = api.user.getWeeklyApr.useQuery();

  return (
    <Card className="flex flex-col items-center justify-center gap-2 rounded-md bg-secondary py-2">
      <div className="flex w-full flex-row items-center justify-center">
        <div className="text-gray-300 px-2 text-sm">Staking APR</div>
        <ToolTip size="300">
          <div className="rounded-sm bg-primary/5 text-[13px] font-medium backdrop-blur-xl dark:bg-primary">
            <span>
              The APR is estimated using the past week&apos;s dividend data.
            </span>
          </div>
        </ToolTip>
      </div>
      <div className="text-2xl font-normal ">
        <Show 
          when={!isLoading && !!apr} 
          fallback={
            <div className="h-8 w-16 bg-foreground/10 rounded animate-pulse"></div>
          }
        >
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
          <AprDisplay currentApr={apr} />
        </Show>
      </div>
    </Card>
  );
}
