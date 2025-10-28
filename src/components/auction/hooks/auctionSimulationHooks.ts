import { parseUnits, zeroAddress, type Address } from "viem";
import { useSimulateContract, useAccount } from "wagmi";
import { SirContract } from "@/contracts/sir";

export const useStartAuction = ({ id }: { id?: string }) => {
  const { isConnected } = useAccount();

  const startAuctionSimulate = useSimulateContract({
    ...SirContract,
    functionName: "collectFeesAndStartAuction",
    args: [(id ?? zeroAddress) as Address],
    query: {
      enabled: isConnected && !!id,
      retry: false, // Don't retry on provider errors
    },
  });

  if (startAuctionSimulate.error && isConnected && id) {
    console.log(
      startAuctionSimulate.error,
      "start auction error",
      startAuctionSimulate.data,
    );
  }

  return id && isConnected ? startAuctionSimulate.data?.request : undefined;
};
export const useGetAuctionLot = ({
  id,
  receiver,
}: {
  id?: string;
  receiver?: string;
}) => {
  const { isConnected } = useAccount();
  
  const getAuctionLotSimulate = useSimulateContract({
    ...SirContract,
    functionName: "getAuctionLot",
    args: [
      (id ?? zeroAddress) as Address,
      (receiver ?? zeroAddress) as Address,
    ],
    query: {
      enabled: isConnected && !!id && !!receiver,
      retry: false, // Don't retry on provider errors
    },
  });

  if (getAuctionLotSimulate.error && isConnected && id && receiver) {
    console.log(
      getAuctionLotSimulate.error,
      "get auction lot error",
      getAuctionLotSimulate.data,
    );
  }

  return id && receiver && isConnected ? getAuctionLotSimulate.data?.request : undefined;
};

export const useBid = ({
  token,
  amount,
  tokenDecimals,
  useNativeToken,
}: {
  token?: string;
  amount: string;
  tokenDecimals?: number;
  useNativeToken?: boolean;
}) => {
  const { isConnected } = useAccount();

  const bidAmount = parseUnits(amount || "0", tokenDecimals ?? 18);

  const bidSimulate = useSimulateContract({
    ...SirContract,
    functionName: "bid",
    args: [
      (token ?? zeroAddress) as Address,
      bidAmount,
    ],
    value: useNativeToken ? bidAmount : undefined,
    query: {
      enabled: isConnected && !!token && !!amount && amount !== "0",
      retry: false, // Don't retry on provider errors
    },
  });

  if (bidSimulate.error && isConnected && token && amount && amount !== "0") {
    console.log(bidSimulate.error, "bid error", bidSimulate.data);
  }

  return {
    request: isConnected && token && amount && amount !== "0" ? bidSimulate.data?.request : undefined,
    refetch: bidSimulate.refetch
  };
};
