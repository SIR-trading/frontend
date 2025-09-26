"use client";
import React from "react";
import AprDisplay from "./aprDisplay";
import { api } from "@/trpc/react";
import ToolTip from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import Show from "@/components/shared/show";

export default function AprCard() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data: apr, isLoading } = api.user.getMonthlyApr.useQuery();

  return (
    <Card className="flex flex-col items-center justify-center gap-3 rounded-md bg-secondary p-6 hover:bg-secondary/80 transition-colors">
      <div className="flex w-full flex-row items-center justify-center">
        <div className="text-muted-foreground px-2 text-sm">Staking APR</div>
        <ToolTip size="300">
          <span>
            The APR is estimated using the past 30 days&apos; dividend data.
          </span>
        </ToolTip>
      </div>
      <Show
        when={!isLoading && !!apr}
        fallback={
          <div className="h-8 w-24 bg-foreground/10 rounded animate-pulse"></div>
        }
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
        <AprDisplay currentApr={apr} />
      </Show>
    </Card>
  );
}
