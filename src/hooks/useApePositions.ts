import { useQuery } from "@tanstack/react-query";
import type { TPositionsResponse } from "@/lib/types";

const useApePositions = () => {
  const { data, ...queryReturns } = useQuery({
    queryKey: ["apePositions"],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard`);
      return (await res.json()) as TPositionsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });

  return {
    data:
      data ??
      ({
        closedApePositions: {},
        activeApePositions: {},
      } as TPositionsResponse),
    ...queryReturns,
  };
};

export default useApePositions;
