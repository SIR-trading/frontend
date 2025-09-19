"use client";
import { Card } from "@/components/ui/card";
import { EPage } from "@/lib/types";
import Explainer from "../shared/explainer";
import { Container } from "@/components/ui/container";
import CalculatorForm from "./calculatorForm/calculatorForm";
import VaultTable from "../leverage-liquidity/vaultTable/vaultTable";
import VaultPagination from "@/components/shared/leverage/VaultPagination";
import { api } from "@/trpc/react";
import NoSSR from "../ui/no-ssr";

export default function LeverageCalculatorContent({
  isApe,
}: {
  isApe: boolean;
}) {
  const { data: vaultQuery } = api.vault.getTableVaults.useQuery(
    {
      offset: 0,
    },
    {
      staleTime: 1000 * 60,
      // Show stale data while refetching to improve UX
      placeholderData: (previousData) => previousData,
    },
  );

  return (
    <Container>
      <Explainer page={EPage.CALCULATOR} />
      <div className="grid w-full gap-x-[16px] gap-y-4 lg:grid-cols-2">
        {/* Always show the form immediately - it handles its own loading states */}
        <CalculatorForm vaultsQuery={vaultQuery?.vaultQuery} isApe={isApe} />

        <Card>
          <div className="flex h-full flex-col justify-between">
            {/* Wrap VaultTable in NoSSR to prevent SSR issues */}
            <NoSSR
              fallback={
                <table className="min-h-[400px] w-full p-4">
                  <thead>
                    <tr className="mb-4 grid grid-cols-7 gap-4 border-b border-foreground/15 pb-2">
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                      <th className="h-4 animate-pulse rounded bg-foreground/10"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="h-12 w-full animate-pulse rounded bg-foreground/10"></tr>
                    <tr className="h-12 w-full animate-pulse rounded bg-foreground/10"></tr>
                    <tr className="h-12 w-full animate-pulse rounded bg-foreground/10"></tr>
                    <tr className="h-12 w-full animate-pulse rounded bg-foreground/10"></tr>
                    <tr className="h-12 w-full animate-pulse rounded bg-foreground/10"></tr>
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
