import { fromHex } from "viem";
import { FeeExplanation } from "@/components/shared/FeeExplanation";

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
  leverageTier,
  fee,
}: {
  ape: string;
  isApe: boolean;
  disabled: boolean;
  vaultId?: string;
  leverageTier?: string;
  fee?: number;
}) {

  return (
    <div className={` pt-2 ${disabled ? "opacity-80" : ""}`}>
      <h2 className="font-geist text-sm font-medium text-foreground">
        You receive
      </h2>
      <div className="pt-1"></div>
      <div className="flex items-center justify-between rounded-md bg-primary/5 p-4 dark:bg-primary">
        <h2
          className={`text-md font-geist-mono text-foreground md:text-2xl`}
        >
          {ape}
        </h2>
        <span className="text-sm text-foreground/80 md:text-xl">
          {isApe ? "APE" : "TEA"}{vaultId ? `-${getDisplayVaultId(vaultId)}` : ""}
        </span>
      </div>

      {/* Show fee explanation for APE tokens */}
      {isApe && fee && fee > 10 && leverageTier && (
        <div className="mt-4">
          <FeeExplanation leverageTier={leverageTier} />
        </div>
      )}
    </div>
  );
}
