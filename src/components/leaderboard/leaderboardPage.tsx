import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import ClosedApePositions from "@/components/leaderboard/closedApePositions";
import ActiveApePositions from "@/components/leaderboard/activeApePositions";
import MonthlyCountdown from "@/components/leaderboard/monthlyCountdown";

const LeaderboardPage = () => {
  return (
    <div className="">
      <Container className="px-4 sm:px-6 lg:px-8">
        <Explainer page={EPage.LEADERBOARD} />
        <div className="flex flex-col gap-12">
          <div className="">
            <div className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <h1 className="text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
                Closed Positions
              </h1>
              <MonthlyCountdown />
            </div>
            <ClosedApePositions />
          </div>

          <div className="">
            <h1 className="pb-2 text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
              Active Positions
            </h1>
            <ActiveApePositions />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LeaderboardPage;
