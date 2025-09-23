import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { useAccount } from "wagmi";
import { useCallback, useMemo, useState, useEffect } from "react";
import type { TAuctionBidModalState } from "@/components/auction/AuctionBidModal";
import { AuctionBidModal } from "@/components/auction/AuctionBidModal";
import AuctionBidFormProvider from "@/components/providers/auctionBidFormProvider";
import { api } from "@/trpc/react";
import type { AuctionFieldFragment } from "@/lib/types";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";
import { TokenDisplay } from "@/components/ui/token-display";
import { AUCTION_DURATION } from "@/components/auction/__constants";
import Countdown from "react-countdown";
import { compareAddress } from "@/lib/utils/index";
import { useResetAuctionsOnTrigger } from "@/components/auction/hooks/useResetAuctionsOnSuccess";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import AuctionContentSkeleton from "@/components/auction/AuctionContentSkeleton";
import Show from "@/components/shared/show";
import type { Address } from "viem";
import { hexToBigInt } from "viem";
import { TokenImage } from "@/components/shared/TokenImage";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { useAuctionRpcPolling } from "@/components/auction/hooks/useAuctionRpcPolling";

const OngoingAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const [openModal, setOpenModal] = useState<TAuctionBidModalState>({
    open: false,
  });
  const { address } = useAccount();
  const [pulsingTokens, setPulsingTokens] = useState<Set<Address>>(new Set());

  const { data: auctions, isLoading } = api.auction.getOngoingAuctions.useQuery(
    address,
    {
      refetchInterval: 60 * 1000,
    },
  );
  const { data: auctionLots, isLoading: isLoadingBal } =
    api.auction.getAuctionBalances.useQuery(
      Array.from(uniqueAuctionCollection.uniqueCollateralToken),
      {
        enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
        refetchInterval: 60 * 1000,
      },
    );

  const [isTriggered, setIsTriggered] = useState(false);
  const resetAuctionOnTrigger = useResetAuctionsOnTrigger();

  const activeTokens = useMemo(() => {
    if (!auctions) return [];
    return auctions.map(a => a.token.id as Address);
  }, [auctions]);

  const {
    mergeWithServerData,
    pollingError,
  } = useAuctionRpcPolling({
    tokens: activeTokens,
    enabled: !openModal.open && activeTokens.length > 0,
    onNewBid: (update) => {
      setPulsingTokens(prev => {
        const next = new Set(prev);
        next.add(update.token);
        return next;
      });

      setTimeout(() => {
        setPulsingTokens(prev => {
          const next = new Set(prev);
          next.delete(update.token);
          return next;
        });
      }, 12000); // 12 seconds timeout (1.5s × 7 iterations = 10.5s + buffer)
    },
  });

  const { userAuction, otherAuction } = useMemo(() => {
    const initial: {
      userAuction: AuctionFieldFragment[];
      otherAuction: AuctionFieldFragment[];
    } = { userAuction: [], otherAuction: [] };
    if (!auctions) {
      return initial;
    }

    const { merged, newBidsDetected } = mergeWithServerData(auctions);

    if (newBidsDetected.length > 0) {
      setPulsingTokens(prev => {
        const next = new Set(prev);
        newBidsDetected.forEach(token => next.add(token));
        return next;
      });

      setTimeout(() => {
        setPulsingTokens(prev => {
          const next = new Set(prev);
          newBidsDetected.forEach(token => next.delete(token));
          return next;
        });
      }, 12000); // 12 seconds timeout (1.5s × 7 iterations = 10.5s + buffer)
    }

    return merged.reduce((acc, auction) => {
      if (Boolean(auction.isParticipant.length)) {
        acc.userAuction.push(auction);
      } else {
        acc.otherAuction.push(auction);
      }
      return acc;
    }, initial);
  }, [auctions, mergeWithServerData]);

  const handleTrigger = useCallback(() => {
    if (isTriggered) {
      return;
    }
    setIsTriggered(true);
    resetAuctionOnTrigger("ongoing");

    setIsTriggered(false);
  }, [isTriggered, resetAuctionOnTrigger]);

  useEffect(() => {
    if (pollingError) {
      console.error("RPC polling error:", pollingError);
    }
  }, [pollingError]);

  // useEffect(() => {
  //   if (!openModal.open) {
  //     refetch();
  //   }
  // }, [openModal.open, refetch]);

  return (
    <div>
      <AuctionBidFormProvider>
        <AuctionBidModal open={openModal} setOpen={setOpenModal} />
      </AuctionBidFormProvider>

      <Show
        when={!isLoading && !isLoadingBal}
        fallback={
          <>
            <AuctionContentSkeleton />
            <div className="h-[64px]" />
            <AuctionContentSkeleton />
          </>
        }
      >
        {userAuction.length > 0 && (
          <>
            <AuctionContentWrapper header={"Ongoing auctions you're part of"}>
              {userAuction.map(
                ({
                  startTime,
                  highestBid,
                  highestBidder,
                  token,
                  amount,
                  isParticipant,
                }) => (
                  <AuctionCard
                    auctionType="ongoing"
                    isPulsing={pulsingTokens.has(token.id as Address)}
                    data={[
                      [
                        {
                          title: AuctionCardTitle.AUCTION_DETAILS,
                          content: (
                            <div className="flex items-baseline gap-2">
                              <TokenImage
                                address={token.id as Address}
                                className="self-center rounded-full"
                                width={24}
                                height={24}
                              />
                              <AddressExplorerLink
                                address={token.id}
                                shortenLength={4}
                              />
                            </div>
                          ),
                          variant: "large",
                        },
                        {
                          title: AuctionCardTitle.AMOUNT,
                          variant: "large",
                          content: (
                            <TokenDisplay
                              amount={
                                (auctionLots?.get(token.id) ?? 0n) > 0n
                                  ? auctionLots?.get(token.id)
                                  : BigInt(amount)
                              }
                              amountSize="large"
                              decimals={
                                uniqueAuctionCollection.collateralDecimalsMap.get(
                                  token.id,
                                ) ?? 18
                              }
                              unitLabel={
                                uniqueAuctionCollection.collateralSymbolMap.get(
                                  token.id,
                                ) ?? ""
                              }
                              className={
                                "font-geist text-[24px] font-normal leading-[32px]"
                              }
                            />
                          ),
                        },
                      ],
                      [
                        {
                          title: AuctionCardTitle.YOUR_BID,
                          content: (
                            <TokenDisplay
                              amount={BigInt(isParticipant[0]?.bid ?? "0")}
                              amountSize="large"
                              decimals={18}
                              unitLabel={getNativeCurrencySymbol()}
                              className={"text-lg"}
                            />
                          ),
                        },
                        {
                          title: AuctionCardTitle.HIGHEST_BID,
                          content: (
                            <TokenDisplay
                              amount={BigInt(highestBid)}
                              amountSize="large"
                              decimals={18}
                              unitLabel={getNativeCurrencySymbol()}
                              className={"text-lg"}
                            />
                          ),
                        },
                      ],
                      [
                        {
                          title: AuctionCardTitle.CLOSES_IN,
                          content: (
                            <Countdown
                              date={(+startTime + AUCTION_DURATION) * 1000}
                              onComplete={handleTrigger}
                            />
                          ),
                        },
                        {
                          title: AuctionCardTitle.LEADER,
                          content: compareAddress(highestBidder, address) ? (
                            "YOU ARE LEADING"
                          ) : (
                            <AddressExplorerLink address={highestBidder} />
                          ),
                        },
                      ],
                    ]}
                    id={token.id}
                    key={token.id}
                    action={{
                      title: compareAddress(highestBidder, address)
                        ? "Top up"
                        : "Bid",
                      onClick: (id) => {
                        setOpenModal({
                          open: true,
                          id,
                          bid: BigInt(highestBid),
                          isTopUp: compareAddress(highestBidder, address),
                        });
                      },
                    }}
                  />
                ),
              )}
            </AuctionContentWrapper>
            <div className="h-[64px]" />
          </>
        )}

        {otherAuction.length > 0 && (
          <AuctionContentWrapper>
            {otherAuction.map(
              ({ startTime, highestBid, token, amount, highestBidder }) => (
                <AuctionCard
                  auctionType="ongoing"
                  isPulsing={pulsingTokens.has(token.id as Address)}
                  data={[
                    [
                      {
                        title: AuctionCardTitle.AUCTION_DETAILS,
                        content: (
                          <div className="flex items-baseline gap-2">
                            <TokenImage
                              address={token.id as Address}
                              className="self-center rounded-full"
                              width={24}
                              height={24}
                            />
                            <AddressExplorerLink
                              address={token.id}
                              shortenLength={4}
                            />
                          </div>
                        ),
                        variant: "large",
                      },
                      {
                        title: AuctionCardTitle.AMOUNT,
                        variant: "large",
                        content: (
                          <TokenDisplay
                            amount={
                              (auctionLots?.get(token.id) ?? 0n) > 0n
                                ? auctionLots?.get(token.id)
                                : BigInt(amount)
                            }
                            amountSize="large"
                            decimals={
                              uniqueAuctionCollection.collateralDecimalsMap.get(
                                token.id,
                              ) ?? 18
                            }
                            unitLabel={
                              uniqueAuctionCollection.collateralSymbolMap.get(
                                token.id,
                              ) ?? ""
                            }
                            className={
                              "font-geist text-[24px] font-normal leading-[32px]"
                            }
                          />
                        ),
                      },
                    ],
                    [
                      {
                        title: AuctionCardTitle.YOUR_BID,
                        content: "N/A",
                      },
                      {
                        title: AuctionCardTitle.HIGHEST_BID,
                        content: (
                          <TokenDisplay
                            amount={BigInt(highestBid)}
                            amountSize="large"
                            decimals={18}
                            unitLabel={getNativeCurrencySymbol()}
                            className={"text-lg"}
                          />
                        ),
                      },
                    ],
                    [
                      {
                        title: AuctionCardTitle.CLOSES_IN,
                        content: (
                          <Countdown
                            date={(+startTime + AUCTION_DURATION) * 1000}
                            onComplete={handleTrigger}
                          />
                        ),
                      },
                      {
                        title: AuctionCardTitle.LEADER,
                        content: compareAddress(highestBidder, address) ? (
                          "YOU ARE LEADING"
                        ) : hexToBigInt(highestBidder as Address) ===
                          BigInt(0) ? (
                          "N/A"
                        ) : (
                          <AddressExplorerLink address={highestBidder} />
                        ),
                      },
                    ],
                  ]}
                  key={token.id}
                  id={token.id}
                  action={{
                    title: "Bid",
                    onClick: (id) => {
                      setOpenModal({
                        open: true,
                        id,
                        bid: BigInt(highestBid),
                      });
                    },
                  }}
                />
              ),
            )}
          </AuctionContentWrapper>
        )}
        {userAuction.length === 0 && otherAuction.length === 0 && (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-lg">No active auctions</p>
          </div>
        )}
      </Show>
    </div>
  );
};

export default OngoingAuction;
