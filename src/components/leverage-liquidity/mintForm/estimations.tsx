import { fromHex } from "viem";
import ToolTip from "@/components/ui/tooltip";

// Helper function to convert vaultId to consistent decimal format
const getDisplayVaultId = (vaultId: string | undefined): string => {
  if (!vaultId) return "";
  // If vaultId starts with '0x', it's hexadecimal and needs conversion
  if (vaultId.startsWith('0x')) {
    try {
      return fromHex(vaultId as `0x${string}`, "number").toString();
    } catch {
      return vaultId; // Return as-is if conversion fails
    }
  }
  // Already in decimal format
  return vaultId;
};

export default function Estimations({
  ape,
  disabled,
  isApe,
  vaultId,
  collateralSymbol,
  debtSymbol,
  hasSirRewards,
}: {
  ape: string;
  isApe: boolean;
  disabled: boolean;
  vaultId?: string;
  leverageTier?: string;
  fee?: number;
  collateralSymbol?: string;
  debtSymbol?: string;
  hasSirRewards?: boolean;
}) {
  // Use fallbacks when symbols are empty or undefined
  const tokenSymbol = collateralSymbol && collateralSymbol.length > 0 ? collateralSymbol : 'collateral';
  const debtTokenSymbol = debtSymbol && debtSymbol.length > 0 ? debtSymbol : 'debt tokens';

  return (
    <div className={` pt-2 ${disabled ? "opacity-80" : ""}`}>
      <h2 className="font-geist text-sm text-foreground">
        You receive
      </h2>
      <div className="pt-1"></div>
      <div className="flex items-center justify-between rounded-md bg-primary/5 p-4 dark:bg-primary">
        <h2
          className={`text-md font-geist-mono text-foreground md:text-2xl`}
        >
          {ape}
        </h2>
        <span className="flex items-center gap-1 text-sm text-foreground/80 md:text-xl">
          <span>{isApe ? "APE" : "TEA"}{vaultId ? `-${getDisplayVaultId(vaultId)}` : ""}</span>
          {!isApe && (
            <ToolTip iconSize={16} size="300">
              <div className="space-y-1.5">
                <div>
                  {vaultId ? `TEA-${getDisplayVaultId(vaultId)}` : 'TEA'} holders provide liquidity and earn fees from {vaultId ? `APE-${getDisplayVaultId(vaultId)}` : 'APE'} traders.
                </div>
                <div>Your position acts like a mix of {tokenSymbol} + {debtTokenSymbol}. Similar to Uniswap&apos;s impermanent loss: you &quot;sell&quot; {tokenSymbol} for {debtTokenSymbol} as price rises (to pay {vaultId ? `APE-${getDisplayVaultId(vaultId)}` : 'APE'} gains) and &quot;buy&quot; as it falls.</div>
                <div>This creates dampened exposure - less upside than spot, but also less downside.</div>
                <div className="pt-1 font-semibold">
                  Think: {tokenSymbol}<sup>x</sup> (where x oscillates between 0-1) + fees
                  {hasSirRewards === true ? " + SIR rewards" : hasSirRewards === undefined ? " + potential SIR rewards" : ""}.
                </div>
              </div>
            </ToolTip>
          )}
        </span>
      </div>
    </div>
  );
}
