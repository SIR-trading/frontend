import { useMemo, useState } from "react";
import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { api } from "@/trpc/react";
import { TokenDisplay } from "@/components/ui/token-display";
import { TokenDisplayWithUsd } from "@/components/auction/TokenDisplayWithUsd";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useStartAuction } from "@/components/auction/hooks/auctionSimulationHooks";
import { AUCTION_COOLDOWN } from "@/components/auction/__constants";
import type { TUniqueAuctionCollection } from "@/components/auction/auctionPage";
import TransactionModal from "@/components/shared/transactionModal";
import { TransactionStatus } from "@/components/leverage-liquidity/mintForm/transactionStatus";
import React from "react";
import { useResetTransactionModal } from "@/components/leverage-liquidity/mintForm/hooks/useResetTransactionModal";
import useResetAuctionsOnSuccess from "@/components/auction/hooks/useResetAuctionsOnSuccess";
import { compareAddress } from "@/lib/utils/index";
import { WRAPPED_NATIVE_TOKEN_ADDRESS } from "@/data/constants";
import Show from "@/components/shared/show";
import AuctionContentSkeleton from "@/components/auction/AuctionContentSkeleton";
import AddressExplorerLink from "@/components/shared/addressExplorerLink";
import { TokenImage } from "@/components/shared/TokenImage";
import type { Address } from "viem";
import { getNativeCurrencySymbol } from "@/lib/chains";
import { formatUnits } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { CircleCheck } from "lucide-react";
import { motion } from "motion/react";
import ExplorerLink from "@/components/shared/explorerLink";

type TNewAuctionData = {
  amount: bigint;
  timeToStart: number;
  token: string;
};

const NewAuction = ({
  uniqueAuctionCollection,
}: {
  uniqueAuctionCollection: TUniqueAuctionCollection;
}) => {
  const { data: tokenWithFeesMap, isLoading: isLoadingBal } =
    api.vault.getTotalCollateralFeesInVault.useQuery(
      Array.from(uniqueAuctionCollection.uniqueCollateralToken),
      {
        enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
        refetchInterval: 60 * 1000,
      },
    );
  const { data: allExistingAuctions, isLoading } =
    api.auction.getallAuctions.useQuery(undefined, {
      refetchInterval: 60 * 1000,
    });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: transactionData,
  } = useWaitForTransactionReceipt({ hash });

  const { openTransactionModal, setOpenTransactionModal } =
    useResetTransactionModal({ reset, isConfirmed });

  const [id, setId] = useState<string>();
  const [collectedAmount, setCollectedAmount] = useState<bigint>();
  const startAuctionRequest = useStartAuction({ id });

  const handleAuctionStart = (id: string) => {
    setId(id);
    // Store the amount before collection
    const amount = tokenWithFeesMap?.get(id);
    if (amount) {
      setCollectedAmount(amount);
    }
    setOpenTransactionModal(true);
  };

  const { readyToStart, onHold } = useMemo(() => {
    const readyToStart = new Set<TNewAuctionData>();
    const onHold = new Set<TNewAuctionData>();
    const currentTime = Math.floor(Date.now() / 1000);

    allExistingAuctions?.forEach((auction) => {
      const amount = tokenWithFeesMap?.get(auction.token.id);

      if (amount && amount > BigInt(0)) {
        const newData: TNewAuctionData = {
          amount,
          timeToStart: +auction.startTime + AUCTION_COOLDOWN,
          token: auction.token.id,
        };

        if (newData.timeToStart > currentTime) {
          onHold.add(newData);
        } else {
          readyToStart.add(newData);
        }
      }
    });
    uniqueAuctionCollection.uniqueCollateralToken.forEach((token) => {
      if (
        allExistingAuctions &&
        !allExistingAuctions?.some((auction) => auction.token.id === token)
      ) {
        const amount = tokenWithFeesMap?.get(token);
        if (amount && amount > BigInt(0))
          readyToStart.add({
            amount,
            timeToStart: 0,
            token,
          });
      }
    });

    return {
      readyToStart: Array.from(readyToStart),
      onHold: Array.from(onHold),
    };
  }, [
    allExistingAuctions,
    tokenWithFeesMap,
    uniqueAuctionCollection.uniqueCollateralToken,
  ]);

  const confirmTransaction = () => {
    if (!isConfirmed) {
      console.log({ id, startAuctionRequest });

      if (id && startAuctionRequest) {
        writeContract(startAuctionRequest);
      }
    } else {
      // Close modal and reset state when clicking Close after success
      setOpenTransactionModal(false);
      setId(undefined);
      setCollectedAmount(undefined);
      reset();
    }
  };

  useResetAuctionsOnSuccess({
    isConfirming,
    isConfirmed,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
    actions: () => {
      // Don't close modal or reset ID here - let user close it manually after seeing success
      // setId(undefined);
      // setOpenTransactionModal(false);
    },
    auctionType: "new",
  });

  return (
    <div>
      <TransactionModal.Root
        title="Collect Fees"
        open={openTransactionModal}
        setOpen={(open) => {
          setOpenTransactionModal(open);
          // Reset state when closing modal
          if (!open) {
            setId(undefined);
            setCollectedAmount(undefined);
            reset();
          }
        }}
      >
        <TransactionModal.Close setOpen={(open) => {
          setOpenTransactionModal(open);
          // Reset state when closing modal
          if (!open) {
            setId(undefined);
            setCollectedAmount(undefined);
            reset();
          }
        }} />

        {/* Show success state when confirmed */}
        <Show when={isConfirmed} fallback={
          <div className="space-y-4 rounded-t-xl px-6 pb-6 pt-6">
            <h2 className="text-center font-geist text-2xl">
              {compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                ? "Collect Fees"
                : "Start Auction"}
            </h2>

            {/* Display the fee amount when collecting native token fees */}
            {compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS) && (
              <div className="space-y-4 px-6 pb-6 pt-4">
                <div className="pt-2">
                  <div className="mb-2">
                    <label className="text-sm text-muted-foreground">Protocol Fees for Stakers</label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">
                      <DisplayFormattedNumber
                        num={formatUnits(tokenWithFeesMap?.get(id ?? "") ?? 0n, 18)}
                        significant={6}
                      />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-muted-foreground">
                        {getNativeCurrencySymbol()}
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
              </div>
            )}

            {/* Display auction info when starting other token auctions */}
            {!compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS) && id && (
              <div className="space-y-4 px-6 pb-6 pt-4">
                <div className="pt-2">
                  <div className="mb-2">
                    <label className="text-sm text-muted-foreground">Starting Auction For</label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl">
                      <DisplayFormattedNumber
                        num={formatUnits(
                          tokenWithFeesMap?.get(id ?? "") ?? 0n,
                          uniqueAuctionCollection.collateralDecimalsMap.get(id ?? "") ?? 18
                        )}
                        significant={6}
                      />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl text-muted-foreground">
                        {uniqueAuctionCollection.collateralSymbolMap.get(id ?? "")}
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
              </div>
            )}

            {/* Transaction status */}
            <div className="flex justify-center">
              <TransactionStatus
                showLoading={isConfirming}
                waitForSign={isPending}
                action={""}
              />
            </div>
          </div>
        }>
          {/* Success state content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 p-8"
          >
            <div className="flex justify-center">
              <CircleCheck size={60} color="hsl(173, 73%, 36%)" />
            </div>
            <h2 className="text-center text-xl font-semibold">
              {compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                ? "Fees Collected Successfully!"
                : "Auction Started Successfully!"}
            </h2>
            <div className="space-y-2">
              <div className="text-center">
                <span className="text-sm text-muted-foreground">
                  {compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                    ? "Amount Collected"
                    : "Auction Started For"}
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-2xl font-mono">
                    <DisplayFormattedNumber
                      num={formatUnits(
                        collectedAmount ?? 0n,
                        compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                          ? 18
                          : uniqueAuctionCollection.collateralDecimalsMap.get(id ?? "") ?? 18
                      )}
                      significant={6}
                    />
                  </span>
                  <div className="flex items-center gap-1">
                    <TokenImage
                      address={id as Address}
                      className="rounded-full"
                      width={24}
                      height={24}
                    />
                    <span className="text-2xl font-mono text-muted-foreground">
                      {compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                        ? getNativeCurrencySymbol()
                        : uniqueAuctionCollection.collateralSymbolMap.get(id ?? "")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <ExplorerLink transactionHash={hash} align="center" />
          </motion.div>
        </Show>

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
            {isConfirmed
              ? "Close"
              : compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                ? "Confirm Collect"
                : "Confirm Start Auction"}
          </TransactionModal.SubmitButton>
        </TransactionModal.StatSubmitContainer>
      </TransactionModal.Root>
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
        {readyToStart.length > 0 && (
          <>
            <AuctionContentWrapper>
              {readyToStart.map((auction, index) => (
                <AuctionCard
                  auctionType="new"
                  data={[
                    [
                      {
                        title: AuctionCardTitle.AUCTION_DETAILS,
                        content: (
                          <div className="flex items-baseline gap-2">
                            <TokenImage
                              address={auction.token as Address}
                              className="rounded-full self-center"
                              width={24}
                              height={24}
                            />
                            <AddressExplorerLink
                              address={auction.token}
                              shortenLength={4}
                            />
                          </div>
                        ),
                        variant: "large",
                      },
                      {
                        title: AuctionCardTitle.AMOUNT,
                        content: (
                          <TokenDisplayWithUsd
                            amountSize="large"
                            amount={auction.amount}
                            decimals={
                              uniqueAuctionCollection.collateralDecimalsMap.get(
                                auction.token,
                              ) ?? 18
                            }
                            unitLabel={
                              uniqueAuctionCollection.collateralSymbolMap.get(
                                auction.token,
                              ) ?? ""
                            }
                            tokenAddress={auction.token}
                            className={
                              "font-geist text-[24px] font-normal leading-[32px]"
                            }
                          />
                        ),
                        variant: "large",
                      },
                    ],
                  ]}
                  action={{
                    title: compareAddress(auction.token, WRAPPED_NATIVE_TOKEN_ADDRESS)
                      ? "Collect Fees"
                      : "Start Auction",
                    onClick: () => {
                      handleAuctionStart(auction.token);
                    },
                  }}
                  disabled={isPending || isConfirming}
                  actionDelay={auction.timeToStart}
                  id={auction.token}
                  key={index}
                />
              ))}
            </AuctionContentWrapper>
            <div className="h-[24px]" />
          </>
        )}
        {onHold.length > 0 && (
          <AuctionContentWrapper>
            {onHold.map((auction, index) => (
              <AuctionCard
                auctionType="new"
                data={[
                  [
                    {
                      title: AuctionCardTitle.AUCTION_DETAILS,
                      content: (
                        <div className="flex items-center gap-2">
                          <TokenImage
                            address={auction.token as Address}
                            className="rounded-full"
                            width={24}
                            height={24}
                          />
                          <AddressExplorerLink
                            address={auction.token}
                            shortenLength={4}
                          />
                        </div>
                      ),
                    },
                    {
                      title: AuctionCardTitle.AMOUNT,
                      content: (
                        <TokenDisplayWithUsd
                          amountSize="large"
                          amount={auction.amount}
                          decimals={
                            uniqueAuctionCollection.collateralDecimalsMap.get(
                              auction.token,
                            ) ?? 18
                          }
                          unitLabel={
                            uniqueAuctionCollection.collateralSymbolMap.get(
                              auction.token,
                            ) ?? ""
                          }
                          tokenAddress={auction.token}
                          className={
                            "font-geist text-[24px] font-normal leading-[32px]"
                          }
                        />
                      ),
                      variant: "large",
                    },
                  ],
                ]}
                id={auction.token}
                key={index}
                action={{
                  title: "Start Auction",
                  onClick: () => {
                    handleAuctionStart(auction.token);
                  },
                }}
                actionDelay={auction.timeToStart}
              />
            ))}
          </AuctionContentWrapper>
        )}

        {readyToStart.length === 0 && onHold.length === 0 && (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-lg">No auctions available</p>
          </div>
        )}
      </Show>
    </div>
  );
};

export default NewAuction;
