"use client";
import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import ClosedApePositions from "@/components/leaderboard/closedApePositions";
import LastMonthClosedPositions from "@/components/leaderboard/lastMonthClosedPositions";
import ActiveApePositions from "@/components/leaderboard/activeApePositions";
import MonthlyCountdown from "@/components/leaderboard/monthlyCountdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import useApePositions from "@/hooks/useApePositions";

const LeaderboardPage = () => {
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString("en-US", { month: "long" });

  // Get counts for badges
  const { data: closedPositions } = api.leaderboard.getClosedApePositions.useQuery();
  const { data: lastMonthPositions } = api.leaderboard.getLastMonthClosedPositions.useQuery();
  const { data: activePositions } = useApePositions();

  const closedCount = (closedPositions ? Object.keys(closedPositions).length : 0) + 
                      (lastMonthPositions ? Object.keys(lastMonthPositions).length : 0);
  const activeCount = activePositions ? Object.keys(activePositions).length : 0;

  return (
    <div className="">
      <Container className="px-4 sm:px-6 lg:px-8">
        <Explainer page={EPage.LEADERBOARD} />
        
        <Tabs defaultValue="closed">
          <TabsList className="mx-auto w-max mb-8 gap-2">
            <TabsTrigger value="closed" className="whitespace-nowrap min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 px-3">
                <span>🏁</span>
                <span>Closed</span>
                {closedCount > 0 && (
                  <span className="inline-flex h-5 items-center justify-center rounded-md border border-foreground/20 bg-background px-1.5 text-xs">
                    {closedCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="active" className="whitespace-nowrap min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 px-3">
                <span>🟢</span>
                <span>Active</span>
                {activeCount > 0 && (
                  <span className="inline-flex h-5 items-center justify-center rounded-md border border-foreground/20 bg-background px-1.5 text-xs">
                    {activeCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="closed" className="space-y-12">
            {/* Current Month Competition */}
            <div className="">
              <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <h1 className="text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
                    {currentMonth} Competition
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Positions closed this month count regardless of open date • Partial burns included
                  </p>
                </div>
                <MonthlyCountdown />
              </div>
              <ClosedApePositions />
            </div>

            {/* Last Month Results */}
            <div className="">
              <div className="pb-4">
                <h1 className="text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
                  {lastMonth} Results
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Previous month&apos;s final standings
                </p>
              </div>
              <LastMonthClosedPositions />
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="">
              <div className="pb-4">
                <h1 className="text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
                  Active Positions
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Currently open positions • Not eligible for monthly competition
                </p>
              </div>
              <ActiveApePositions />
            </div>
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
};

export default LeaderboardPage;
