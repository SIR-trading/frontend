"use client";
import PageHeadingSpace from "@/components/shared/pageHeadingSpace";
import { Container } from "@/components/ui/container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OngoingAuction from "@/components/auction/ongoingAuction";
import NewAuction from "@/components/auction/newAuction";
import PastAuction from "@/components/auction/pastAuction";
import type { TVaultsCollateralToken, VaultFieldFragment } from "@/lib/types";
import { useMemo } from "react";
import { api } from "@/trpc/react";

const tabsItems = [
  ["ongoing", "Ongoing"],
  ["new", "Start new"],
  ["past", "Past"],
] as const;

const AuctionPage = ({ vaults }: { vaults: VaultFieldFragment[] }) => {
  const uniqueVaultsCollateralToken = useMemo(() => {
    return vaults.reduce<TVaultsCollateralToken>(
      (acc, vault) => {
        if (!acc.collateralToken.some((v) => v === vault.collateralToken)) {
          acc.collateralToken.push(vault.collateralToken);
          acc.collateralSymbol.push(vault.collateralSymbol);
          acc.apeDecimals.push(vault.apeDecimals);
        }
        return acc;
      },
      {
        collateralToken: [],
        collateralSymbol: [],
        apeDecimals: [],
      },
    );
  }, [vaults]);

  const { data: auctions, refetch } = api.auction.getOngoingAuctions.useQuery(
    uniqueVaultsCollateralToken.collateralToken,
    {
      enabled: uniqueVaultsCollateralToken.collateralToken.length > 0,
    },
  );

  return (
    <div>
      <PageHeadingSpace />
      <Container className="max-w-[904px] lg:w-[904px]">
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
            <OngoingAuction
              auctions={auctions?.ongoing}
              tokensForAuctions={uniqueVaultsCollateralToken}
              refetch={async () => {
                await refetch();
              }}
            />
          </TabsContent>
          <TabsContent value="new" className="mt-10">
            <NewAuction
              tokensForAuctions={uniqueVaultsCollateralToken}
              ongoingAuctions={auctions?.ongoing}
              pastAuctions={auctions?.past}
            />
          </TabsContent>
          <TabsContent value="past" className="mt-10">
            <PastAuction
              auctions={auctions?.past}
              tokensForAuctions={uniqueVaultsCollateralToken}
            />
          </TabsContent>
        </Tabs>
      </Container>
    </div>
  );
};

export default AuctionPage;
