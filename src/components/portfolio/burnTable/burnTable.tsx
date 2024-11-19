"use client";
import React, { useEffect, useMemo, useState } from "react";
import BurnTableHeaders from "./burnTableHeader";
import SelectedRow from "./selected-row";
import { api } from "@/trpc/react";
import { useAccount } from "wagmi";
import { BurnTableRow } from "./burnTableRow";
import useCheckUserHasPositions from "./hooks/useCheckUserHasPositions";
import Show from "@/components/shared/show";

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
  const ape = api.user.getApePositions.useQuery({ address });
  const tea = api.user.getTeaPositions.useQuery({ address });

  const selectedRowParamsApe = useMemo(() => {
    return ape.data?.userPositions.find(
      (r) => r.vaultId === selectedRow?.vaultId && selectedRow.isApe,
    );
  }, [ape.data?.userPositions, selectedRow]);
  const selectedRowParamsTea = useMemo(() => {
    return tea.data?.userPositionTeas.find(
      (r) => r.vaultId === selectedRow?.vaultId && !selectedRow.isApe,
    );
  }, [selectedRow, tea.data?.userPositionTeas]);

  const apeLength = ape?.data?.userPositions?.length ?? 0;
  const teaLength = tea?.data?.userPositionTeas?.length ?? 0;
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
  const apePosition = ape.data?.userPositions.map((r) => (
    <>
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
          positionDecimals: r.positionDecimals,
          collateralSymbol: r.collateralSymbol,
          debtSymbol: r.debtSymbol,
          collateralToken: r.collateralToken,
          debtToken: r.debtToken,
          leverageTier: r.leverageTier,
          vaultId: r.vaultId,
        }}
        isApe={true}
        apeAddress={r.APE}
      />
    </>
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
          apeAddress={selectedRowParamsApe?.APE}
          close={() => {
            setSelectedRow(undefined);
          }}
        />
      )}
      {showTea}

      {!selectedRow && (
        <table className="w-full animate-fade-in">
          <caption className="hidden">Burn Tokens</caption>
          <tbody className="flex flex-col gap-y-4">
            <BurnTableHeaders />
            {/* PLEASE REFACTOR THIS!!! */}
            <Show
              when={!loading}
              fallback={<IdleContainer>Loading...</IdleContainer>}
            >
              <Show
                when={hasPositions}
                fallback={<IdleContainer>No Positions.</IdleContainer>}
              >
                <Show when={filter === "ape" || filter === "all"}>
                  {apePosition}
                </Show>
                <Show when={filter === "tea" || filter === "all"}>
                  {tea.data?.userPositionTeas.map((r) => {
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
                        />
                      </>
                    );
                  })}
                </Show>
              </Show>
            </Show>
          </tbody>
        </table>
      )}
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
