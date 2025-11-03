"use client";
import { Card } from "@/components/ui/card";
import { EPage } from "@/lib/types";
import { Container } from "@/components/ui/container";
import VaultTable from "./vaultTable/vaultTable";
import MintForm from "./mintForm/mintForm";
import Explainer from "../shared/explainer";
import VaultPagination from "@/components/shared/leverage/VaultPagination";
import VaultRowSkeleton from "./vaultTable/vaultRowSkeleton";
import NoSSR from "@/components/ui/no-ssr";
import { api } from "@/trpc/react";
import Image from "next/image";

export default function LeverageLiquidityContent({
  isApe,
  offset = 0,
}: {
  isApe: boolean;
  offset?: number;
}) {
  const { data: vaultQuery } = api.vault.getTableVaults.useQuery(
    {
      offset,
      filters: {
        skip: 0,
      },
    },
    {
      staleTime: 1000 * 60,
      // Show stale data while refetching to improve UX
      placeholderData: (previousData) => previousData,
    },
  );

  return (
    <Container>
      <Explainer page={isApe ? EPage.LEVERAGE : EPage.LIQUIDITY} />
      <div className="grid w-full gap-x-[16px] gap-y-4 lg:grid-cols-2">
        {/* Always show the form immediately - it handles its own loading states */}
        {/* Add margin-top on mobile to prevent image overlap with explainer text */}
        <div className="mt-10 lg:mt-0">
          <MintForm vaultsQuery={vaultQuery?.vaultQuery} isApe={isApe} />
        </div>

        <Card className={"relative h-full overflow-visible md:px-5"}>
          <NoSSR>
            {!isApe && (
              <>
                {/* CSS-based theme switching: Both images loaded, visibility controlled by CSS */}
                <Image
                  src="/Gorilla_drinking_tea.png"
                  alt="Gorilla drinking tea"
                  width={180}
                  height={180}
                  className="pointer-events-none absolute -top-[6.7rem] right-0 z-10 hidden dark:lg:block"
                />
                <Image
                  src="/Gorilla_drinking_tea_white.png"
                  alt="Gorilla drinking tea"
                  width={180}
                  height={180}
                  className="pointer-events-none absolute -top-[6.7rem] right-0 z-10 hidden lg:block dark:lg:hidden"
                />
              </>
            )}
            {isApe && (
              <>
                {/* CSS-based theme switching: Both images loaded, visibility controlled by CSS */}
                <Image
                  src="/Monkey_drinking_whiskey.png"
                  alt="Monkey drinking whiskey"
                  width={220}
                  height={220}
                  className="pointer-events-none absolute -right-[2.3rem] -top-[6.8rem] z-10 hidden dark:lg:block"
                />
                <Image
                  src="/Monkey_drinking_whiskey_white.png"
                  alt="Monkey drinking whiskey"
                  width={220}
                  height={220}
                  className="pointer-events-none absolute -right-[2.3rem] -top-[6.8rem] z-10 hidden lg:block dark:lg:hidden"
                />
              </>
            )}
          </NoSSR>
          <div className="flex h-full flex-col justify-between">
            {/* Wrap VaultTable in NoSSR to prevent SSR issues */}
            <NoSSR
              fallback={
                <table className="w-full">
                  <caption className="pb-6 text-left text-[20px] font-semibold leading-[24px]">
                    Popular Vaults
                  </caption>
                  <thead>
                    <tr className="border-b border-foreground/15 text-left text-[14px] font-normal text-muted-foreground">
                      <th className="pb-1 pl-3 pr-4 font-medium">Id</th>
                      <th className="pb-1 pr-4 font-medium">Vault</th>
                      <th className="pb-1 pr-4 font-medium">
                        {!isApe ? "APY" : "Fee"}
                      </th>
                      <th className="hidden pb-1 pr-4 font-medium min-[375px]:table-cell">
                        POL
                      </th>
                      <th className="hidden pb-1 pr-4 font-medium xl:table-cell">
                        Leverage
                      </th>
                      <th className="pb-1 text-right font-medium">TVL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <VaultRowSkeleton />
                    <VaultRowSkeleton />
                    <VaultRowSkeleton />
                    <VaultRowSkeleton />
                    <VaultRowSkeleton />
                  </tbody>
                </table>
              }
            >
              <VaultTable isApe={isApe} />
            </NoSSR>
            <VaultPagination
              max={Math.ceil((vaultQuery?.vaultQuery?.vaults.length ?? 0) / 8)}
            />
          </div>
        </Card>
      </div>
    </Container>
  );
}
