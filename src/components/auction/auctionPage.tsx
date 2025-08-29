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
import { Badge } from "@/components/ui/badge";

export type TUniqueAuctionCollection = {
  uniqueCollateralToken: Set<string>;
  collateralSymbolMap: Map<string, string>;
  collateralDecimalsMap: Map<string, number>;
};

const AuctionPage = () => {
  const { data: vaults } = api.vault.getVaults.useQuery();
  const { data: ongoingAuctions } = api.auction.getOngoingAuctions.useQuery();
  const { data: expiredAuctions } = api.auction.getExpiredAuctions.useQuery({});

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

  const ongoingCount = ongoingAuctions?.length ?? 0;
  const pastCount = expiredAuctions?.length ?? 0;

  return (
    <div>
      <PageHeadingSpace />
      <Container className="max-w-[904px] lg:w-[904px]">
        <Explainer page={EPage.AUCTIONS} />
        <Tabs defaultValue="active">
          <TabsList className="mx-auto w-max">
            <TabsTrigger value="create">
              <span className="flex items-center gap-1.5">
                <span>➕</span>
                <span>Start</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="active">
              <span className="flex items-center gap-1.5">
                <span>🟢</span>
                <span>Active</span>
                {ongoingCount > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 w-auto px-1.5 text-xs">
                    {ongoingCount}
                  </Badge>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger value="history">
              <span className="flex items-center gap-1.5">
                <span>📋</span>
                <span>History</span>
                {pastCount > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 w-auto px-1.5 text-xs">
                    {pastCount}
                  </Badge>
                )}
              </span>
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
