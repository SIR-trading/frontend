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
import { getNativeCurrencySymbol, getAuctionBidIncreasePercentage } from "@/lib/chains";
import { getSirSymbol } from "@/lib/assets";
import { useVaultData } from "@/contexts/VaultDataContext";
import { useRealtimeAuctions } from "@/hooks/useRealtimeAuctions";

export type TUniqueAuctionCollection = {
  uniqueCollateralToken: Set<string>;
  collateralSymbolMap: Map<string, string>;
  collateralDecimalsMap: Map<string, number>;
};

const AuctionPage = () => {
  const { allVaults: vaultsData } = useVaultData();

  // WebSocket for real-time auction updates across all tabs
  const { lastBid } = useRealtimeAuctions();

  const { data: ongoingAuctions } = api.auction.getOngoingAuctions.useQuery();
  const { data: allExistingAuctions } = api.auction.getallAuctions.useQuery();
  const { data: auctionCounts } = api.auction.getAuctionCounts.useQuery();

  // Transform the vault data to match the expected format
  const vaults = useMemo(() => {
    if (!vaultsData) return undefined;
    return { vaults: vaultsData };
  }, [vaultsData]);

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
      const token = vault.collateralToken.id;
      if (!uniqueCollateralToken.has(token)) {
        uniqueCollateralToken.add(token);
        collateralSymbolMap.set(token, vault.collateralToken.symbol ?? '');
        collateralDecimalsMap.set(token, vault.collateralToken.decimals);
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
      const amount = tokenWithFeesMap.get(auction.token.id);
      if (amount && amount > BigInt(0)) {
        const timeToStart = +auction.startTime + AUCTION_COOLDOWN;
        if (timeToStart <= currentTime) {
          count++;
        }
      }
    });

    // Check new tokens that have never had an auction
    uniqueAuctionCollection.uniqueCollateralToken.forEach((token) => {
      if (!allExistingAuctions.some((auction) => auction.token.id === token)) {
        const amount = tokenWithFeesMap.get(token);
        if (amount && amount > BigInt(0)) {
          count++;
        }
      }
    });

    return count;
  }, [allExistingAuctions, tokenWithFeesMap, uniqueAuctionCollection.uniqueCollateralToken]);

  const ongoingCount = ongoingAuctions?.length ?? 0;

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
                <span className="inline-flex h-5 items-center justify-center rounded-md border border-foreground/20 bg-background px-1.5 text-xs">
                  {auctionCounts?.expiredAuctions ?? 0}
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-10">
            <div className="mb-6 text-center text-sm text-muted-foreground">
              Auction protocol fees to convert them to {getNativeCurrencySymbol()} for {getSirSymbol()} stakers
            </div>
            <NewAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
          <TabsContent value="active" className="mt-10">
            <div className="mb-6 text-center text-sm text-muted-foreground">
              Bid on active auctions to acquire tokens below market price
              <br />
              <span className="text-xs">
                Minimum bid increase: {getAuctionBidIncreasePercentage()}%
              </span>
            </div>
            <OngoingAuction uniqueAuctionCollection={uniqueAuctionCollection} lastBid={lastBid} />
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
