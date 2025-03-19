import { subgraphSyncPoll } from "@/lib/utils/sync";
import { api } from "@/trpc/react";
import { useCallback, useEffect } from "react";

interface Props {
  isConfirmed: boolean;
  isConfirming: boolean;
  txBlock?: number;
  actions: () => void;
  auctionType: "new" | "ongoing" | "past";
  halt?: boolean;
}

export default function useResetAuctionsOnSuccess({
  isConfirmed,
  isConfirming,
  txBlock,
  actions,
  auctionType,
  halt,
}: Props) {
  const utils = api.useUtils();

  console.log({
    here: "useResetAuctionsOnSuccess",
    isConfirmed,
    isConfirming,
    txBlock,
    actions,
    auctionType,
  });

  useEffect(() => {
    if (isConfirmed && !halt) {
      actions();
      subgraphSyncPoll(txBlock)
        .then(() => {
          utils.vault.getVaults.invalidate().catch((e) => console.log(e));
          if (auctionType === "new") {
            utils.auction.getallAuctions
              .invalidate()
              .catch((e) => console.log(e));
            utils.vault.getTotalCollateralFeesInVault
              .invalidate()
              .catch((e) => console.log(e));
          }
          if (auctionType === "ongoing") {
            utils.auction.getOngoingAuctions
              .invalidate()
              .catch((e) => console.log(e));
            utils.auction.getallAuctions
              .invalidate()
              .catch((e) => console.log(e));
          }
          if (auctionType === "past") {
            utils.auction.getExpiredAuctions
              .invalidate()
              .catch((e) => console.log(e));
            utils.auction.getAuctionBalances
              .invalidate()
              .catch((e) => console.log(e));
          }
        })
        .catch((e) => console.log(e));
    }
  }, [
    isConfirming,
    isConfirmed,
    utils.vault.getVaults,
    utils.vault.getTotalCollateralFeesInVault,
    utils.auction.getOngoingAuctions,
    txBlock,
    actions,
    utils.auction.getallAuctions,
    auctionType,
    utils.auction.getExpiredAuctions,
    utils.auction.getAuctionBalances,
  ]);
}

export function useResetAuctionsOnTrigger() {
  const utils = api.useUtils();

  const trigger = useCallback(
    (auctionType: "new" | "ongoing" | "past") => {
      console.log(`Resetting auctions for ${auctionType}`);
      utils.vault.getVaults.invalidate().catch((e) => console.log(e));
      if (auctionType === "new") {
        utils.vault.getTotalCollateralFeesInVault
          .invalidate()
          .catch((e) => console.log(e));
        utils.auction.getallAuctions.invalidate().catch((e) => console.log(e));
      }
      if (auctionType === "ongoing") {
        utils.auction.getOngoingAuctions
          .invalidate()
          .catch((e) => console.log(e));
        utils.auction.getallAuctions.invalidate().catch((e) => console.log(e));
      }
    },
    [
      utils.auction.getOngoingAuctions,
      utils.auction.getallAuctions,
      utils.vault.getTotalCollateralFeesInVault,
      utils.vault.getVaults,
    ],
  );

  return trigger;
}
