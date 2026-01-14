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
import { useVaultData } from "@/contexts/VaultDataContext";
import { useMemo } from "react";

export default function LeverageCalculatorContent({
  isApe,
}: {
  isApe: boolean;
}) {
  // Use VaultDataContext to get ALL vaults for the calculator form
  const { allVaults } = useVaultData();

  // Transform to match expected format for CalculatorForm
  const allVaultsQuery = useMemo(() => {
    if (!allVaults) return undefined;
    return { vaults: allVaults };
  }, [allVaults]);

  // Still use paginated query for the table display
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
        {/* Use ALL vaults for the form to ensure filtering works with all vaults */}
        <CalculatorForm vaultsQuery={allVaultsQuery} isApe={isApe} />

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
            <VaultPagination />
          </div>
        </Card>
      </div>
    </Container>
  );
}
