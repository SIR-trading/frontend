"use client";
import PageHeadingSpace from "@/components/shared/pageHeadingSpace";
import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OngoingAuction from "@/components/auction/ongoingAuction";
import { useMemo } from "react";
import { api } from "@/trpc/react";
import PastAuction from "@/components/auction/pastAuction";
import NewAuction from "@/components/auction/newAuction";
import { EPage } from "@/lib/types";
import Explainer from "../shared/explainer";
import { AUCTION_COOLDOWN } from "@/components/auction/__constants";

export type TUniqueAuctionCollection = {
  uniqueCollateralToken: Set<string>;
  collateralSymbolMap: Map<string, string>;
  collateralDecimalsMap: Map<string, number>;
};

const AuctionPage = () => {
  const { data: vaults } = api.vault.getVaults.useQuery();
  const { data: ongoingAuctions } = api.auction.getOngoingAuctions.useQuery();
  const { data: expiredAuctions } = api.auction.getExpiredAuctions.useQuery({});
  const { data: allExistingAuctions } = api.auction.getallAuctions.useQuery();

  const uniqueAuctionCollection = useMemo<TUniqueAuctionCollection>(() => {
    const uniqueCollateralToken = new Set<string>();
    const collateralSymbolMap = new Map<string, string>();
    const collateralDecimalsMap = new Map<string, number>();

    if (!vaults) {
      return {
        uniqueCollateralToken,
        collateralSymbolMap,
        collateralDecimalsMap,
      };
    }

    vaults.vaults.forEach((vault) => {
      const token = vault.collateralToken;
      if (!uniqueCollateralToken.has(token)) {
        uniqueCollateralToken.add(token);
        collateralSymbolMap.set(token, vault.collateralSymbol);
        collateralDecimalsMap.set(token, vault.apeDecimals);
      }
    });

    return {
      uniqueCollateralToken,
      collateralSymbolMap,
      collateralDecimalsMap,
    };
  }, [vaults]);

  const { data: tokenWithFeesMap } = api.vault.getTotalCollateralFeesInVault.useQuery(
    Array.from(uniqueAuctionCollection.uniqueCollateralToken),
    {
      enabled: uniqueAuctionCollection.uniqueCollateralToken.size > 0,
    },
  );

  // Calculate ready to start count
  const readyToStartCount = useMemo(() => {
    if (!tokenWithFeesMap || !allExistingAuctions) return 0;
    
    let count = 0;
    const currentTime = Math.floor(Date.now() / 1000);

    // Check existing auctions that can be restarted
    allExistingAuctions.forEach((auction) => {
      const amount = tokenWithFeesMap.get(auction.token);
      if (amount && amount > BigInt(0)) {
        const timeToStart = +auction.startTime + AUCTION_COOLDOWN;
        if (timeToStart <= currentTime) {
          count++;
        }
      }
    });

    // Check new tokens that have never had an auction
    uniqueAuctionCollection.uniqueCollateralToken.forEach((token) => {
      if (!allExistingAuctions.some((auction) => auction.token === token)) {
        const amount = tokenWithFeesMap.get(token);
        if (amount && amount > BigInt(0)) {
          count++;
        }
      }
    });

    return count;
  }, [allExistingAuctions, tokenWithFeesMap, uniqueAuctionCollection.uniqueCollateralToken]);

  const ongoingCount = ongoingAuctions?.length ?? 0;
  const pastCount = expiredAuctions?.length ?? 0;

  return (
    <div>
      <PageHeadingSpace />
      <Container className="max-w-[904px] lg:w-[904px]">
        <Explainer page={EPage.AUCTIONS} />
        <Tabs defaultValue="active">
          <TabsList className="mx-auto w-max gap-2">
            <TabsTrigger value="create" className="whitespace-nowrap px-3">
              <div className="flex items-center justify-center gap-1.5 px-2">
                <span>➕</span>
                <span>Start</span>
                <span className="inline-flex h-5 items-center justify-center rounded-md border border-foreground/20 bg-background px-1.5 text-xs">
                  {readyToStartCount}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="active" className="whitespace-nowrap px-3">
              <div className="flex items-center justify-center gap-1.5 px-2">
                <span>🟢</span>
                <span>Active</span>
                <span className="inline-flex h-5 items-center justify-center rounded-md border border-foreground/20 bg-background px-1.5 text-xs">
                  {ongoingCount}
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="history" className="whitespace-nowrap px-3">
              <div className="flex items-center justify-center gap-1.5 px-2">
                <span>📋</span>
                <span>History</span>
                {pastCount > 0 && (
                  <span className="inline-flex h-5 items-center justify-center rounded-md border border-foreground/20 bg-background px-1.5 text-xs">
                    {pastCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-10">
            <div className="mb-6 text-center text-sm text-muted-foreground">
              Auction protocol fees to convert them to ETH for SIR stakers
            </div>
            <NewAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
          <TabsContent value="active" className="mt-10">
            <div className="mb-6 text-center text-sm text-muted-foreground">
              Bid on active auctions to acquire tokens below market price
            </div>
            <OngoingAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
          <TabsContent value="history" className="mt-10">
            <div className="mb-6 text-center text-sm text-muted-foreground">
              View completed auctions and results
            </div>
            <PastAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
};

export default AuctionPage;
