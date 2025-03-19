"use client";
import PageHeadingSpace from "@/components/shared/pageHeadingSpace";
import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OngoingAuction from "@/components/auction/ongoingAuction";
import { useMemo } from "react";
import { api } from "@/trpc/react";
import PastAuction from "@/components/auction/pastAuction";
import NewAuction from "@/components/auction/newAuction";

export type TUniqueAuctionCollection = {
  uniqueCollateralToken: Set<string>;
  collateralSymbolMap: Map<string, string>;
  collateralDecimalsMap: Map<string, number>;
};

const tabsItems = [
  ["ongoing", "Ongoing"],
  ["new", "Start new"],
  ["past", "Past"],
] as const;

const AuctionPage = () => {
  const { data: vaults } = api.vault.getVaults.useQuery();

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

  return (
    <div>
      <PageHeadingSpace />
      <Container className="w-svw max-w-[904px] lg:w-[904px]">
        <Tabs defaultValue="ongoing">
          <TabsList className="mx-auto w-max">
            {tabsItems.map(([value, text]) => (
              <TabsTrigger
                value={value}
                key={value}
                className="data-[state=active]:border-white"
              >
                {text}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="ongoing" className="mt-10">
            <OngoingAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
          <TabsContent value="new" className="mt-10">
            <NewAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
          <TabsContent value="past" className="mt-10">
            <PastAuction uniqueAuctionCollection={uniqueAuctionCollection} />
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
};

export default AuctionPage;
