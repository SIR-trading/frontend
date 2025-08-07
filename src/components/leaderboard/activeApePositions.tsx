"use client";
import React from "react";
import { ActiveApePositionsTable } from "@/components/leaderboard/activeApePositionsTable";
import useApePositions from "@/hooks/useApePositions";

const ActiveApePositions = () => {
  const {
    data: { activeApePositions: openApePositions },
    isLoading,
  } = useApePositions();

  return (
    <ActiveApePositionsTable data={openApePositions} isLoading={isLoading} />
  );
};

export default ActiveApePositions;
