"use client";
import React, { useEffect, useMemo, useState } from "react";
import BurnTableHeaders from "./burnTableHeader";
import SelectedRow from "./selected-row";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import { BurnTableRow } from "./burnTableRow";
import useCheckUserHasPositions from "./hooks/useCheckUserHasPositions";
import Show from "@/components/shared/show";
import BurnTableRowSkeleton from "./burnTableRowSkeleton";
import type { TUserPosition } from "@/server/queries/vaults";

export default function BurnTable({
  filter,
}: {
  filter: "ape" | "tea" | "all";
}) {
  const [selectedRow, setSelectedRow] = useState<
    | {
        vaultId: string;
        isApe: boolean;
        mode: "burn" | "claim" | "transfer";
      }
    | undefined
  >();
  const { address, isConnected } = useAccount();
  const { data: userBalancesInVaults } =
    api.user.getUserBalancesInVaults.useQuery({ address });
  const ape = api.user.getApePositions.useQuery({ address });
  const tea = api.user.getTeaPositions.useQuery({ address });

  const selectedRowParamsApe = useMemo(() => {
    const position = ape.data?.apePositions.find(
      (r) => r.vault.id === selectedRow?.vaultId && selectedRow.isApe,
    );
    if (!position) return undefined;
    // Transform to TUserPosition with flattened properties
    return {
      ...position,
      vaultId: position.vault.id,
      leverageTier: position.vault.leverageTier.toString(),
      collateralToken: position.vault.collateralToken.id,
      collateralSymbol: position.vault.collateralToken.symbol ?? "Unknown",
      decimals:
        position.vault.ape?.decimals ?? position.vault.collateralToken.decimals,
      debtToken: position.vault.debtToken.id,
      debtSymbol: position.vault.debtToken.symbol ?? "Unknown",
    } as TUserPosition;
  }, [ape.data?.apePositions, selectedRow]);

  const selectedRowParamsTea = useMemo(() => {
    const position = tea.data?.teaPositions.find(
      (r) => r.vault.id === selectedRow?.vaultId && !selectedRow.isApe,
    );
    if (!position) return undefined;
    // Transform to TUserPosition with flattened properties
    return {
      ...position,
      vaultId: position.vault.id,
      leverageTier: position.vault.leverageTier.toString(),
      collateralToken: position.vault.collateralToken.id,
      collateralSymbol: position.vault.collateralToken.symbol ?? "Unknown",
      decimals: position.vault.collateralToken.decimals,
      debtToken: position.vault.debtToken.id,
      debtSymbol: position.vault.debtToken.symbol ?? "Unknown",
    } as TUserPosition;
  }, [selectedRow, tea.data?.teaPositions]);

  const apeLength = ape?.data?.apePositions?.length ?? 0;
  const teaLength = tea?.data?.teaPositions?.length ?? 0;
  const hasPositions = useCheckUserHasPositions({
    apeLength,
    teaLength,
    filter,
  });
  useEffect(() => {
    if (selectedRow?.vaultId) {
      window.document.getElementById("burn-form")?.scrollIntoView();
    }
  }, [selectedRow?.vaultId]);
  const loading = ape.isLoading || tea.isLoading;

  const apePosition = ape.data?.apePositions.map((r, index) => (
    <BurnTableRow
      setSelectedRow={(mode: "burn" | "claim" | "transfer") =>
        setSelectedRow({
          vaultId: r.vault.id,
          isApe: true,
          mode,
        })
      }
      key={(r.vault.id || index) + "ape"}
      row={{
        ...r,
        // Flattened properties for backwards compatibility
        decimals: r.vault.ape?.decimals ?? r.vault.collateralToken.decimals,
        collateralSymbol: r.vault.collateralToken.symbol || "Unknown",
        debtSymbol: r.vault.debtToken.symbol || "Unknown",
        collateralToken: r.vault.collateralToken.id,
        debtToken: r.vault.debtToken.id,
        leverageTier: r.vault.leverageTier.toString(),
        vaultId: r.vault.id,
      }}
      isApe={true}
      apeAddress={r.vault.ape.id}
      apeBal={userBalancesInVaults?.apeBalances[Number(r.vault.id) - 1]}
      teaBal={userBalancesInVaults?.teaBalances[Number(r.vault.id) - 1]}
      teaRewards={
        userBalancesInVaults?.unclaimedSirRewards[Number(r.vault.id) - 1]
      }
    />
  ));
  let showTea = undefined;
  if (selectedRow !== undefined && selectedRowParamsTea !== undefined) {
    showTea = (
      <SelectedRow
        isApe={false}
        mode={selectedRow.mode}
        params={selectedRowParamsTea}
        close={() => {
          setSelectedRow(undefined);
        }}
        teaBal={
          userBalancesInVaults?.teaBalances[
            Number(selectedRowParamsTea.vaultId) - 1
          ]
        }
        apeBal={
          userBalancesInVaults?.apeBalances[
            Number(selectedRowParamsTea.vaultId) - 1
          ]
        }
        teaRewards={
          userBalancesInVaults?.unclaimedSirRewards[
            Number(selectedRowParamsTea.vaultId) - 1
          ]
        }
      />
    );
  }

  return (
    <div className="relative">
      {selectedRowParamsApe && selectedRow && (
        <SelectedRow
          mode={selectedRow.mode}
          isApe
          params={selectedRowParamsApe}
          apeAddress={selectedRowParamsApe?.vault.ape?.id}
          close={() => {
            setSelectedRow(undefined);
          }}
          teaBal={
            userBalancesInVaults?.teaBalances[
              Number(selectedRowParamsApe.vaultId) - 1
            ]
          }
          apeBal={
            userBalancesInVaults?.apeBalances[
              Number(selectedRowParamsApe.vaultId) - 1
            ]
          }
          teaRewards={
            userBalancesInVaults?.unclaimedSirRewards[
              Number(selectedRowParamsApe.vaultId) - 1
            ]
          }
        />
      )}
      {showTea}

      {loading ? (
        <div className="w-full animate-fade-in">
          <table className="w-full table-auto">
            <BurnTableHeaders isApe={filter === "ape"} />
            <tbody>
              <BurnTableRowSkeleton />
              <BurnTableRowSkeleton />
              <BurnTableRowSkeleton />
            </tbody>
          </table>
        </div>
      ) : hasPositions ? (
        <div className="w-full animate-fade-in">
          <table className="w-full table-auto">
            <BurnTableHeaders isApe={filter === "ape"} />
            <tbody>
              <Show when={filter === "ape" || filter === "all"}>
                {apePosition}
              </Show>
              <Show when={filter === "tea" || filter === "all"}>
                {tea.data?.teaPositions.map((r, index) => {
                  return (
                    <BurnTableRow
                      key={(r.vault.id || index) + "tea"}
                      row={{
                        ...r,
                        // Flattened properties for backwards compatibility
                        decimals: r.vault.collateralToken.decimals,
                        collateralSymbol:
                          r.vault.collateralToken.symbol ?? "Unknown",
                        debtSymbol: r.vault.debtToken.symbol ?? "Unknown",
                        collateralToken: r.vault.collateralToken.id,
                        debtToken: r.vault.debtToken.id,
                        leverageTier: r.vault.leverageTier.toString(),
                        vaultId: r.vault.id,
                      }}
                      isApe={false}
                      setSelectedRow={(mode: "burn" | "claim" | "transfer") =>
                        setSelectedRow({
                          vaultId: r.vault.id,
                          isApe: false,
                          mode,
                        })
                      }
                      apeBal={
                        userBalancesInVaults?.apeBalances[
                          Number(r.vault.id) - 1
                        ]
                      }
                      teaBal={
                        userBalancesInVaults?.teaBalances[
                          Number(r.vault.id) - 1
                        ]
                      }
                      teaRewards={
                        userBalancesInVaults?.unclaimedSirRewards[
                          Number(r.vault.id) - 1
                        ]
                      }
                    />
                  );
                })}
              </Show>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center">
          <span className="italic text-foreground">
            {isConnected ? "No Positions" : "Connect wallet to see portfolio"}
          </span>
        </div>
      )}

      {/* Footnote for APE tokens */}
      {(filter === "ape" || filter === "all") && apeLength > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="mr-1">*</span>
          Required price gains assume sufficient liquidity in the vault
        </div>
      )}

      {/* Footnote for TEA tokens */}
      {(filter === "tea" || filter === "all") && teaLength > 0 && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="mr-1">†</span>
          Required times assume APY remains constant
        </div>
      )}
    </div>
  );
}

function IdleContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-6">
      <h1 className="italic text-foreground">{children}</h1>
    </div>
  );
}
