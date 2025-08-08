"use client";
import React from "react";
import { ActiveApePositionsTable } from "@/components/leaderboard/activeApePositionsTable";
import useApePositions from "@/hooks/useApePositions";

const ActiveApePositions = () => {
  const { data: openApePositions, isLoading } = useApePositions();

  return (
    <ActiveApePositionsTable data={openApePositions} isLoading={isLoading} />
  );
};

export default ActiveApePositions;
