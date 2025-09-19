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
        <MintForm vaultsQuery={vaultQuery?.vaultQuery} isApe={isApe} />

        <Card className={"md:px-5"}>
          <div className="flex h-full flex-col justify-between">
            {/* Wrap VaultTable in NoSSR to prevent SSR issues */}
            <NoSSR
              fallback={
                <table className="w-full">
                  <caption className="pb-6 text-left text-[20px] font-semibold leading-[24px]">
                    Popular Vaults
                  </caption>
                  <thead>
                    <tr className="grid grid-cols-4 text-left text-[14px] font-normal text-foreground/60 md:grid-cols-9">
                      <th className="font-medium">Id</th>
                      <th className="font-medium md:col-span-3">Vault</th>
                      <th className="hidden items-center gap-x-1 font-medium md:flex">
                        {!isApe ? "APY" : "Pol"}
                      </th>
                      <th className="gap hidden items-center gap-x-1 font-medium md:flex">
                        Fees
                      </th>
                      <th className="relative z-10 flex items-center gap-x-1 font-medium">
                        Leverage
                      </th>
                      <th className="relative text-right font-medium md:col-span-2">
                        TVL
                      </th>
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
