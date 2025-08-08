import { useQuery } from "@tanstack/react-query";
import type { TCurrentApePositions } from "@/lib/types";

const useApePositions = () => {
  const { data, ...queryReturns } = useQuery({
    queryKey: ["apePositions"],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard`, {
        cache: "no-cache",
      });
      return (await res.json()) as TCurrentApePositions;
    },
    // staleTime: 5 * 60 * 1000, // 5 minutes
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
