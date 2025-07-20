import { Container } from "../ui/container";
import { EPage } from "@/lib/types";
import Explainer from "@/components/shared/explainer";
import ClosedApePositions from "@/components/leaderboard/closedApePositions";
import ActiveApePositions from "@/components/leaderboard/activeApePositions";

const LeaderboardPage = () => {
  return (
    <div className="">
      <Container className="">
        <Explainer page={EPage.LEADERBOARD} />
        <div className="flex flex-col gap-12">
          <div className="">
            <h1 className="pb-2 text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
              Closed Ape Positions
            </h1>
            <ClosedApePositions />
          </div>

          <div className="">
            <h1 className="pb-2 text-[18px] font-semibold md:text-[20px] lg:text-[28px]">
              Active Ape Positions
            </h1>
            <ActiveApePositions />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LeaderboardPage;
