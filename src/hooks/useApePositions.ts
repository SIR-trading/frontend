import { useQuery } from "@tanstack/react-query";
import type { TCurrentApePositions } from "@/lib/types";

const useApePositions = () => {
  const { data, ...queryReturns } = useQuery({
    queryKey: ["apePositions"],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard`, {
        cache: "no-cache",
      });
      if (!res.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      return (await res.json()) as TCurrentApePositions;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes when page is active
    refetchIntervalInBackground: false, // Don't refetch when page is in background
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 3, // Retry failed requests up to 3 times
    placeholderData: (previousData) => previousData,
  });

  console.log({
    data,
  });

  return {
    data: data ?? ({} as TCurrentApePositions),
    ...queryReturns,
  };
};

export default useApePositions;
