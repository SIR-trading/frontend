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
  const { data: tokenWithFeesMap } =
    api.vault.getTotalCollateralFeesInVault.useQuery(
      Array.from(uniqueAuctionCollection.uniqueCollateralToken),
      {
        enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
        refetchInterval: 60 * 1000,
      },
    );
  const { data: allExistingAuctions } = api.auction.getallAuctions.useQuery(
    undefined,
    {
      refetchInterval: 60 * 1000,
    },
  );

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
              {isPending || isConfirming ? "Starting" : "Start"} Auction for{" "}
              {uniqueAuctionCollection.collateralSymbolMap.get(id ?? "")}
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
      <AuctionContentWrapper header="Ready to Start">
        {readyToStart.map((auction, index) => (
          <AuctionCard
            auctionType="new"
            data={[
              [
                {
                  title: AuctionCardTitle.AUCTION_DETAILS,
                  content: uniqueAuctionCollection.collateralSymbolMap.get(
                    auction.token,
                  ),
                  variant: "large",
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
                        "font-lora text-[32px] font-normal leading-[32px]"
                      }
                    />
                  ),
                  variant: "large",
                },
              ],
            ]}
            action={{
              title: "Start Auction",
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
      <AuctionContentWrapper header="On Hold">
        {onHold.map((auction, index) => (
          <AuctionCard
            auctionType="new"
            data={[
              [
                {
                  title: AuctionCardTitle.AUCTION_DETAILS,
                  content: uniqueAuctionCollection.collateralSymbolMap.get(
                    auction.token,
                  ),
                  variant: "large",
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
                        "font-lora text-[32px] font-normal leading-[32px]"
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
    </div>
  );
};

export default NewAuction;
