"use client";
import { Card } from "../ui/card";
import StakeCard from "./stakeCard";

const StakeTabs = () => {
  return (
    <div className="pt-6">
      <Card className="mx-auto">
        <StakeCard />
      </Card>
    </div>
  );
};

export default StakeTabs;
