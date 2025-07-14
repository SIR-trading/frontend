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

export default function BurnTable({
  filter,
}: {
  filter: "ape" | "tea" | "all";
}) {
  const [selectedRow, setSelectedRow] = useState<
    | {
        vaultId: string;
        isApe: boolean;
        isClaiming: boolean;
      }
    | undefined
  >();
  const { address } = useAccount();
  const { data: userBalancesInVaults } =
    api.user.getUserBalancesInVaults.useQuery({ address });
  const ape = api.user.getApePositions.useQuery({ address });
  const tea = api.user.getTeaPositions.useQuery({ address });

  const selectedRowParamsApe = useMemo(() => {
    return ape.data?.apePositions.find(
      (r) => r.vaultId === selectedRow?.vaultId && selectedRow.isApe,
    );
  }, [ape.data?.apePositions, selectedRow]);
  const selectedRowParamsTea = useMemo(() => {
    return tea.data?.teaPositions.find(
      (r) => r.vaultId === selectedRow?.vaultId && !selectedRow.isApe,
    );
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

  const apePosition = ape.data?.apePositions.map((r) => (
    <BurnTableRow
      setSelectedRow={(isClaiming: boolean) =>
        setSelectedRow({
          vaultId: r.vaultId,
          isApe: true,
          isClaiming,
        })
      }
      key={r.vaultId + "ape"}
      row={{
        id: r.vaultId,
        balance: r.balance,
        user: r.user,
        decimals: r.decimals,
        collateralSymbol: r.collateralSymbol,
        debtSymbol: r.debtSymbol,
        collateralToken: r.collateralToken,
        debtToken: r.debtToken,
        leverageTier: r.leverageTier,
        vaultId: r.vaultId,
      }}
      isApe={true}
      apeAddress={r.ape}
      apeBal={userBalancesInVaults?.apeBalances[Number(r.vaultId) - 1]}
      teaBal={userBalancesInVaults?.teaBalances[Number(r.vaultId) - 1]}
      teaRewards={
        userBalancesInVaults?.unclaimedSirRewards[Number(r.vaultId) - 1]
      }
    />
  ));
  let showTea = undefined;
  if (selectedRow !== undefined && selectedRowParamsTea !== undefined) {
    showTea = (
      <SelectedRow
        isApe={false}
        isClaiming={selectedRow.isClaiming}
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
          isClaiming={selectedRow?.isClaiming}
          isApe
          params={selectedRowParamsApe}
          apeAddress={selectedRowParamsApe?.ape}
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

      {
        <div className="w-full animate-fade-in">
          <div className="flex flex-col gap-y-4">
            <BurnTableHeaders />
            {/* PLEASE REFACTOR THIS!!! */}
            <Show
              when={!loading}
              fallback={
                <>
                  <BurnTableRowSkeleton />
                  <BurnTableRowSkeleton />
                  <BurnTableRowSkeleton />
                </>
              }
            >
              <Show
                when={hasPositions}
                fallback={<IdleContainer>No Positions.</IdleContainer>}
              >
                <Show when={filter === "ape" || filter === "all"}>
                  {apePosition}
                </Show>
                <Show when={filter === "tea" || filter === "all"}>
                  {tea.data?.teaPositions.map((r) => {
                    return (
                      <>
                        <BurnTableRow
                          row={{
                            ...r,
                          }}
                          key={r.id + "tea"}
                          isApe={false}
                          setSelectedRow={(isClaiming: boolean) =>
                            setSelectedRow({
                              vaultId: r.vaultId,
                              isApe: false,
                              isClaiming,
                            })
                          }
                          apeBal={
                            userBalancesInVaults?.apeBalances[
                              Number(r.vaultId) - 1
                            ]
                          }
                          teaBal={
                            userBalancesInVaults?.teaBalances[
                              Number(r.vaultId) - 1
                            ]
                          }
                          teaRewards={
                            userBalancesInVaults?.unclaimedSirRewards[
                              Number(r.vaultId) - 1
                            ]
                          }
                        />
                      </>
                    );
                  })}
                </Show>
              </Show>
            </Show>
          </div>
        </div>
      }
    </div>
  );
}

function IdleContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-6">
      <h1 className="text-gray-300">{children}</h1>
    </div>
  );
}
