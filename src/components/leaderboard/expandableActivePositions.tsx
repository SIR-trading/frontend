import type { TCurrentApePositions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { fromHex } from "viem";
import DisplayFormattedNumber from "@/components/shared/displayFormattedNumber";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Show from "@/components/shared/show";
import BurnForm from "@/components/portfolio/burnForm/burnForm";
import { BurnFormModal } from "@/components/portfolio/burnTable/burnFormModal";

const cellStyling = "pr-2 md:pr-4 py-2.5 flex-1 flex items-center";

const ExpandableActivePositions = ({
  positions,
  vault,
  userAddress: address,
}: {
  positions: TCurrentApePositions[string]["positions"];
  vault: (_vaultId: `0x${string}`) => {
    vaultId: number;
    collateralSymbol: string;
  };
  userAddress?: `0x${string}` | undefined;
}) => {
  const [isOwned, setIsOwned] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    vaultId: string;
    isApe: boolean;
    isClaiming: boolean;
    positionAddress: string;
  } | null>(null);

  const { data: userBalancesInVaults } =
    api.user.getUserBalancesInVaults.useQuery(
      { address },
      { enabled: Boolean(address) },
    );

  const { data: apePositions } = api.user.getApePositions.useQuery(
    { address },
    { enabled: Boolean(address) },
  );

  const getUserApeBalance = (vaultId: number) => {
    if (!userBalancesInVaults) return 0n;
    return userBalancesInVaults.apeBalances[vaultId - 1] ?? 0n;
  };

  const getUserApePosition = (vaultId: number) => {
    return apePositions?.apePositions.find(
      (pos) => fromHex(pos.vaultId as `0x${string}`, "number") === vaultId,
    );
  };

  const selectedApePosition = selectedPosition
    ? getUserApePosition(+selectedPosition.vaultId)
    : null;

  return (
    <>
      {selectedPosition && selectedApePosition && (
        <BurnFormModal reset={() => setSelectedPosition(null)}>
          <BurnForm
            balance={getUserApeBalance(parseInt(selectedPosition.vaultId))}
            row={{
              id: selectedApePosition.vaultId,
              balance: selectedApePosition.balance,
              user: selectedApePosition.user,
              decimals: selectedApePosition.decimals,
              collateralSymbol: selectedApePosition.collateralSymbol,
              debtSymbol: selectedApePosition.debtSymbol,
              collateralToken: selectedApePosition.collateralToken,
              debtToken: selectedApePosition.debtToken,
              leverageTier: selectedApePosition.leverageTier,
              vaultId: selectedApePosition.vaultId,
            }}
            isApe={true}
            close={() => setSelectedPosition(null)}
            teaRewardBalance={0n}
            isClaiming={false}
            levTier={selectedApePosition.leverageTier}
          />
        </BurnFormModal>
      )}
      <div className="flex bg-primary/10 pl-2 text-left text-xs font-medium text-foreground/70 md:pl-6 dark:bg-primary">
        <div className={cn(cellStyling, "flex-none")}>Token</div>
        <div className={cn(cellStyling)}>Collateral Deposited</div>
        <div className={cn(cellStyling)}>Current PnL [USD]</div>
        <div className={cn(cellStyling)}>Current PnL [Collateral]</div>
        <div className={cn(cellStyling)}>Current % PnL [USD]</div>
        <div className={cn(cellStyling)}>Current % PnL [Collateral]</div>
        <div
          className={cn(cellStyling, "flex-none", isOwned && "pr-0 md:pr-0")}
        >
          <Show when={isOwned}>
            <span className={"w-[45px]"}></span>
          </Show>
        </div>
      </div>
      <div className="w-full space-y-[2px]">
        {positions.map((position, index) => {
          const vaultData = vault(position.vaultId);
          const userBalance = getUserApeBalance(vaultData.vaultId);
          const hasBalance = userBalance > 0n;

          if (
            !isOwned &&
            address?.toLowerCase() === position.user.toLowerCase()
          )
            setIsOwned(true);
          // Only show burn for connected user's own positions
          const isUserPosition =
            address &&
            hasBalance &&
            address?.toLowerCase() === position.user.toLowerCase();

          return (
            <div
              key={index}
              className="flex bg-primary/5 pl-2 text-left text-xs font-normal md:pl-6 dark:bg-primary/50"
            >
              <div className={cn(cellStyling, "flex-none")}>
                APE-{vaultData.vaultId}
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber num={+position.collateralTotal} />{" "}
                {vaultData.collateralSymbol}
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber num={position.pnlUsd} /> USD
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber num={position.pnlCollateral} />{" "}
                {vaultData.collateralSymbol}
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber num={position.pnlUsdPercentage} />%
              </div>
              <div className={cn(cellStyling)}>
                <DisplayFormattedNumber
                  num={position.pnlCollateralPercentage}
                />
                %
              </div>
              <div
                className={cn(cellStyling, "relative flex-none pr-0 md:pr-0")}
              >
                <Show when={!!isUserPosition}>
                  <Button
                    onClick={() =>
                      setSelectedPosition({
                        vaultId: vaultData.vaultId.toString(),
                        isApe: true,
                        isClaiming: false,
                        positionAddress: position.user,
                      })
                    }
                    type="button"
                    className="h-7 w-[45px] -translate-x-2 rounded-full p-1 text-[12px] md:-translate-x-4"
                  >
                    Burn
                  </Button>
                </Show>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ExpandableActivePositions;
