import { parseUnits, zeroAddress, type Address } from "viem";
import { useSimulateContract } from "wagmi";
import { SirContract } from "@/contracts/sir";

export const useStartAuction = ({ id }: { id?: string }) => {
  const startAuctionSimulate = useSimulateContract({
    ...SirContract,
    functionName: "collectFeesAndStartAuction",
    args: [(id ?? zeroAddress) as Address],
  });

  if (startAuctionSimulate.error) {
    console.log(
      startAuctionSimulate.error,
      "start auction error",
      startAuctionSimulate.data,
    );
  }

  return id ? startAuctionSimulate.data?.request : undefined;
};
export const useGetAuctionLot = ({
  id,
  receiver,
}: {
  id?: string;
  receiver?: string;
}) => {
  const getAuctionLotSimulate = useSimulateContract({
    ...SirContract,
    functionName: "getAuctionLot",
    args: [
      (id ?? zeroAddress) as Address,
      (receiver ?? zeroAddress) as Address,
    ],
  });

  if (getAuctionLotSimulate.error) {
    console.log(
      getAuctionLotSimulate.error,
      "start auction error",
      getAuctionLotSimulate.data,
    );
  }

  return id ? getAuctionLotSimulate.data?.request : undefined;
};

export const useBid = ({
  token,
  amount,
  tokenDecimals,
}: {
  token?: string;
  amount: string;
  tokenDecimals?: number;
}) => {
  const bidSimulate = useSimulateContract({
    ...SirContract,
    functionName: "bid",
    args: [
      (token ?? zeroAddress) as Address,
      parseUnits(amount, tokenDecimals ?? 18),
    ],
  });

  if (bidSimulate.error) {
    console.log(bidSimulate.error, "bid error", bidSimulate.data);
  }

  return { request: bidSimulate.data?.request, refetch: bidSimulate.refetch };
};
