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
  const { data: vaultQuery } = api.vault.getTableVaults.useQuery({
    offset: 0,
  }, {
    staleTime: 1000 * 60,
    // Show stale data while refetching to improve UX
    placeholderData: (previousData) => previousData,
  });

  return (
    <Container>
      <Explainer page={EPage.CALCULATOR} />
      <div className="grid w-full gap-x-[16px] gap-y-4 xl:grid-cols-2">
        {/* Always show the form immediately - it handles its own loading states */}
        <CalculatorForm vaultsQuery={vaultQuery?.vaultQuery} isApe={isApe} />
        
        <Card>
          <div className="flex h-full flex-col justify-between">
            {/* Wrap VaultTable in NoSSR to prevent SSR issues */}
            <NoSSR 
              fallback={
                <table className="w-full p-4 min-h-[400px]">
                  <thead>
                    <tr className="grid grid-cols-7 gap-4 mb-4 pb-2 border-b border-foreground/15">
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                      <th className="h-4 bg-foreground/10 rounded animate-pulse"></th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="h-12 w-full bg-foreground/10 rounded animate-pulse"></tr>
                    <tr className="h-12 w-full bg-foreground/10 rounded animate-pulse"></tr>
                    <tr className="h-12 w-full bg-foreground/10 rounded animate-pulse"></tr>
                    <tr className="h-12 w-full bg-foreground/10 rounded animate-pulse"></tr>
                    <tr className="h-12 w-full bg-foreground/10 rounded animate-pulse"></tr>
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
