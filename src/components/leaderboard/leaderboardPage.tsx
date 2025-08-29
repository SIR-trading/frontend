import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import ClosedApePositions from "@/components/leaderboard/closedApePositions";
import LastMonthClosedPositions from "@/components/leaderboard/lastMonthClosedPositions";
import ActiveApePositions from "@/components/leaderboard/activeApePositions";
import MonthlyCountdown from "@/components/leaderboard/monthlyCountdown";

const LeaderboardPage = () => {
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="">
      <Container className="px-4 sm:px-6 lg:px-8">
        <Explainer page={EPage.LEADERBOARD} />
        <div className="flex flex-col gap-12">
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

          {/* Active Positions */}
          <div className="">
            <div className="pb-4">
              <h1 className="text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
                Active Positions
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Currently open positions
              </p>
            </div>
            <ActiveApePositions />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LeaderboardPage;
