import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { TokenDisplay } from "@/components/ui/token-display";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { SirContract } from "@/contracts/sir";
import { useState, useMemo } from "react";
import { useWriteContract } from "wagmi";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";
import { api } from "@/trpc/react";
import { compareAddress } from "@/lib/utils/index";
import TransactionModal from "@/components/shared/transactionModal";
import { useResetTransactionModal } from "@/components/leverage-liquidity/mintForm/hooks/useResetTransactionModal";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import Show from "@/components/shared/show";
import AuctionContentSkeleton from "@/components/auction/AuctionContentSkeleton";
import type { Address } from "viem";
import { hexToBigInt } from "viem";
import Pagination from "@/components/shared/pagination";
import { AUCTION_DURATION } from "@/components/auction/__constants";
import { TokenImage } from "@/components/shared/TokenImage";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import ExplorerLink from "@/components/shared/explorerLink";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { formatUnits } from "viem";

const PAGE_SIZE = 4; // Number of auctions per page

const PastAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const { address } = useAccount();
  const [page, setPage] = useState(1);
  // Track cursors for each page: cursorHistory[0] = cursor for page 2, cursorHistory[1] = cursor for page 3, etc.
  const [cursorHistory, setCursorHistory] = useState<number[]>([]);

  // Current cursor: undefined for page 1, otherwise use the cursor from history
  const currentCursor = page === 1 ? undefined : cursorHistory[page - 2];

  // Fetch PAGE_SIZE + 1 to detect if there are more results
  const { data: rawAuctions, isPending: isLoading } =
    api.auction.getExpiredAuctions.useQuery({
      user: address,
      first: PAGE_SIZE + 1,
      cursor: currentCursor,
    });

  // Determine if there are more pages and get the display auctions
  const { auctions, hasMore } = useMemo(() => {
    if (!rawAuctions) return { auctions: undefined, hasMore: false };
    const hasMorePages = rawAuctions.length > PAGE_SIZE;
    const displayAuctions = hasMorePages ? rawAuctions.slice(0, PAGE_SIZE) : rawAuctions;
    return { auctions: displayAuctions, hasMore: hasMorePages };
  }, [rawAuctions]);
  const { data: auctionLots, isPending: isLoadingBal } =
    api.auction.getAuctionBalances.useQuery(
      Array.from(uniqueAuctionCollection.uniqueCollateralToken),
      {
        enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
      },
    );

  const { writeContract, data: hash, isPending, reset, error: writeError } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  const { openTransactionModal, setOpenTransactionModal } =
    useResetTransactionModal({ reset, isConfirmed });

  const [id, setId] = useState<string>();

  const handleGetAuctionLot = (id: string) => {
    setId(id);
    setOpenTransactionModal(true);
  };

  const confirmTransaction = () => {
    if (!isConfirmed) {
      if (id && address) {
        // Direct contract call without pre-simulation - wagmi handles simulation internally
        writeContract({
          ...SirContract,
          functionName: "getAuctionLot",
          args: [id as Address, address],
        });
      }
    } else {
      setOpenTransactionModal(false);
    }
  };

  const nextPage = () => {
    const lastAuction = auctions?.[auctions.length - 1];
    if (hasMore && lastAuction) {
      // Get the startTime of the last displayed auction as the cursor for the next page
      const nextCursor = parseInt(lastAuction.startTime);

      // Store this cursor for navigating back
      setCursorHistory((prev) => {
        const newHistory = [...prev];
        // Store cursor at index (page - 1) for accessing page (page + 1)
        newHistory[page - 1] = nextCursor;
        return newHistory;
      });

      setPage((p) => p + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  // WebSocket handles auction data refresh via useRealtimeAuctions hook

  return (
    <div>
      <TransactionModal.Root
        title="Claim Auction Lot"
        open={openTransactionModal}
        setOpen={setOpenTransactionModal}
      >
        <TransactionModal.Close setOpen={setOpenTransactionModal} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          {!isConfirmed ? (
            <>
              <h2 className="mb-4 text-center text-xl font-semibold">
                Claim Auction Lot
              </h2>

              <div className="pt-2">
                <div className="mb-2">
                  <label className="text-sm text-muted-foreground">
                    Amount
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">
                    <DisplayFormattedNumber
                      num={formatUnits(
                        BigInt(auctionLots?.get(id ?? "") ?? "0"),
                        uniqueAuctionCollection.collateralDecimalsMap.get(id ?? "") ?? 18
                      )}
                      significant={3}
                    />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-muted-foreground">
                      {uniqueAuctionCollection.collateralSymbolMap.get(id ?? "") ?? ""}
                    </span>
                    <TokenImage
                      address={id as Address}
                      className="rounded-full"
                      width={24}
                      height={24}
                    />
                  </div>
                </div>
              </div>

              {/* Error display */}
              {writeError && !isConfirming && !isConfirmed && (() => {
                // Check if this is a simulation error (not user rejection)
                const errorMessage = writeError.message || "";
                const isUserRejection = errorMessage.toLowerCase().includes("user rejected") ||
                                       errorMessage.toLowerCase().includes("user denied") ||
                                       errorMessage.toLowerCase().includes("rejected the request");

                // Only show error for simulation failures, not user rejections
                if (!isUserRejection) {
                  return (
                    <div className="mt-3">
                      <p className="text-xs text-center" style={{ color: "#ef4444" }}>
                        Transaction simulation failed. Please check your inputs and try again.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </>
          ) : (
            // Success state
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <CircleCheck size={40} color="hsl(173, 73%, 36%)" />
              </div>
              <h2 className="text-center text-xl font-semibold">
                Lot Claimed Successfully!
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-semibold">
                  <DisplayFormattedNumber
                    num={formatUnits(
                      BigInt(auctionLots?.get(id ?? "") ?? "0"),
                      uniqueAuctionCollection.collateralDecimalsMap.get(id ?? "") ?? 18
                    )}
                    significant={3}
                  />
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-muted-foreground">
                    {uniqueAuctionCollection.collateralSymbolMap.get(id ?? "") ?? ""}
                  </span>
                  <TokenImage
                    address={id as Address}
                    className="rounded-full"
                    width={24}
                    height={24}
                  />
                </div>
              </div>
              <div className="text-center text-muted-foreground">
                Your auction lot has been sent to your wallet.
              </div>
              <ExplorerLink transactionHash={hash} />
            </motion.div>
          )}
        </TransactionModal.InfoContainer>

        {!isConfirmed && (
          <>
            <div className="mx-4 border-t border-foreground/10" />
            <TransactionModal.StatSubmitContainer>
              <TransactionModal.SubmitButton
                onClick={confirmTransaction}
                disabled={
                  (!isConfirmed && !Boolean(id)) || isPending || isConfirming
                }
                isPending={isPending}
                loading={isConfirming}
                isConfirmed={isConfirmed}
              >
                Claim
              </TransactionModal.SubmitButton>
            </TransactionModal.StatSubmitContainer>
          </>
        )}

        {isConfirmed && (
          <>
            <div className="mx-4 border-t border-foreground/10" />
            <TransactionModal.StatSubmitContainer>
              <TransactionModal.SubmitButton
                disabled={false}
                isPending={false}
                loading={false}
                onClick={() => setOpenTransactionModal(false)}
                isConfirmed={true}
              >
                Close
              </TransactionModal.SubmitButton>
            </TransactionModal.StatSubmitContainer>
          </>
        )}
      </TransactionModal.Root>
      <Show
        when={!isLoading && !isLoadingBal}
        fallback={<AuctionContentSkeleton />}
      >
        {auctions && auctions.length > 0 ? (
          <>
            <AuctionContentWrapper>
              {auctions?.map(
                ({
                  amount,
                  highestBid,
                  highestBidder,
                  token,
                  isClaimed,
                  startTime,
                }) => (
                  <AuctionCard
                    data={[
                      [
                        {
                          title: AuctionCardTitle.TOKEN,
                          content: (
                            <div className="flex items-baseline gap-2">
                              <TokenImage
                                address={token.id as Address}
                                className="rounded-full self-center"
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
                          content: (
                            <TokenDisplay
                              amount={BigInt(amount)}
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
                          variant: "large",
                        },
                      ],
                      [
                        {
                          title: AuctionCardTitle.WINNING_BID,
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
                        {
                          title: AuctionCardTitle.Winner,
                          content: compareAddress(highestBidder, address) ? (
                            "YOU WON"
                          ) : hexToBigInt(highestBidder as Address) ===
                            BigInt(0) ? (
                            <span className="italic text-muted-foreground">Passed</span>
                          ) : (
                            <AddressExplorerLink address={highestBidder} />
                          ),
                        },
                      ],
                      [
                        {
                          title: AuctionCardTitle.ENDED,
                          content: new Date(
                            (+startTime + AUCTION_DURATION) * 1000
                          ).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }),
                        },
                      ],
                    ]}
                    key={`${token.id}-${startTime}`}
                    action={
                      compareAddress(highestBidder, address)
                        ? {
                            title: isClaimed ? "Claimed" : "Claim",
                            onClick: () => {
                              handleGetAuctionLot(token.id);
                            },
                          }
                        : undefined
                    }
                    disabled={isClaimed}
                    id={token.id}
                  />
                ),
              )}
            </AuctionContentWrapper>{" "}
            <div className="pr-4">
              <Pagination
                max={PAGE_SIZE}
                page={page}
                nextPage={nextPage}
                prevPage={prevPage}
                length={hasMore ? PAGE_SIZE : 0}
                size="lg"
              />
            </div>
          </>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-lg">No auctions available</p>
          </div>
        )}
      </Show>
    </div>
  );
};

export default PastAuction;
