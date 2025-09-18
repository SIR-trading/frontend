import { useMemo, useState } from "react";
import AuctionContentWrapper from "@/components/auction/auctionContentWrapper";
import AuctionCard, {
  AuctionCardTitle,
} from "@/components/auction/auctionCard";
import { api } from "@/trpc/react";
import { TokenDisplay } from "@/components/ui/token-display";
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
import { getWrappedTokenSymbol } from "@/lib/chains";

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
  const startAuctionRequest = useStartAuction({ id });

  const handleAuctionStart = (id: string) => {
    setId(id);
    setOpenTransactionModal(true);
  };

  const { readyToStart, onHold } = useMemo(() => {
    const readyToStart = new Set<TNewAuctionData>();
    const onHold = new Set<TNewAuctionData>();
    const currentTime = Math.floor(Date.now() / 1000);

    allExistingAuctions?.forEach((auction) => {
      const amount = tokenWithFeesMap?.get(auction.token);

      if (amount && amount > BigInt(0)) {
        const newData: TNewAuctionData = {
          amount,
          timeToStart: +auction.startTime + AUCTION_COOLDOWN,
          token: auction.token,
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
        !allExistingAuctions?.some((auction) => auction.token === token)
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
      setOpenTransactionModal(false);
    }
  };

  useResetAuctionsOnSuccess({
    isConfirming,
    isConfirmed,
    txBlock: parseInt(transactionData?.blockNumber.toString() ?? "0"),
    actions: () => {
      setId(undefined);
      setOpenTransactionModal(false);
    },
    auctionType: "new",
  });

  return (
    <div>
      <TransactionModal.Root
        title="Start Auction"
        open={openTransactionModal}
        setOpen={setOpenTransactionModal}
      >
        <TransactionModal.Close setOpen={setOpenTransactionModal} />
        <TransactionModal.InfoContainer isConfirming={isConfirming} hash={hash}>
          <div className="grid gap-4">
            <h4 className="text-lg font-bold">
              {compareAddress(id, WRAPPED_NATIVE_TOKEN_ADDRESS)
                ? `${isPending || isConfirming ? "Collecting" : "Collect"} ${getWrappedTokenSymbol()} Fees`
                : `${isPending || isConfirming ? "Starting" : "Start"} Auction for
              ${uniqueAuctionCollection.collateralSymbolMap.get(id ?? "")} `}
            </h4>
            <TransactionStatus
              showLoading={isConfirming}
              waitForSign={isPending}
              action={""}
            />
          </div>
        </TransactionModal.InfoContainer>
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
            {isConfirmed ? "Confirmed" : "Confirm"}
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
                          <div className="flex items-center gap-2">
                            <TokenImage
                              address={auction.token as Address}
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
                          <TokenDisplay
                            labelSize="small"
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
            <div className="h-[64px]" />
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
                        <TokenDisplay
                          labelSize="small"
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
                className={
                  auction.timeToStart > Date.now() / 1000
                    ? "relative before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-full before:rounded-2xl before:bg-[rgba(255,255,255,0.03)] before:backdrop-blur-[1px]"
                    : undefined
                }
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
