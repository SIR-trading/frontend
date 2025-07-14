"use client";
import { Card } from "../ui/card";
import ClaimCard from "../shared/claimCard";
import StakeCard from "./stakeCard";

const StakeTabs = () => {
  return (
    <div className="pt-6">
      <Card className="mx-auto grid gap-4 md:grid-cols-2">
        <div>
          <StakeCard />
        </div>
        <div>
          <ClaimCard />
        </div>
      </Card>
    </div>
  );
};

export default StakeTabs;
