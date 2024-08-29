import { Badge, type badgeVariants } from "@/components/ui/badge";
import {
  calculateTeaVaultFee,
  calculateApeVaultFee,
  formatNumber,
  getLeverageRatio,
  getLogoAsset,
  roundDown,
} from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import Image from "next/image";
import { useMintFormProviderApi } from "@/components/providers/mintFormProviderApi";
import type { VaultFieldFragment } from "@/lib/types";
import { formatUnits, parseUnits } from "viem";
import ToolTip from "@/components/ui/tooltip";
export function VaultTableRow({
  badgeVariant,
  pool,
  isApe,
}: {
  badgeVariant: VariantProps<typeof badgeVariants>;
  number: string;
  pool: VaultFieldFragment;
  isApe: boolean;
}) {
  const fee = isApe
    ? calculateApeVaultFee(pool.leverageTier) * 100
    : calculateTeaVaultFee();

  const { setValue } = useMintFormProviderApi();
  console.log("Rerender vault table row");
  return (
    <tr
      onClick={() => {
        setValue("versus", pool.debtToken + "," + pool.debtSymbol);
        setValue("long", pool.collateralToken + "," + pool.collateralSymbol);
        setValue("leverageTier", pool.leverageTier.toString());
      }}
      className="grid cursor-pointer text-sm grid-cols-5   md:grid-cols-8 rounded-md px-1 py-1 text-left text-[16px] font-normal transition-colors hover:bg-primary"
    >
      <th className="">{pool.vaultId}</th>
      <th className="md:col-span-3 flex">
        <Image
          className="h-6 w-6 rounded-full "
          src={getLogoAsset(pool.collateralToken as `0x${string}`)}
          width={28}
          height={28}
          alt=""
        />
        <Image
          className="h-6 w-6 rounded-full "
          src={getLogoAsset(pool.debtToken as `0x${string}`)}
          width={28}
          height={28}
          alt=""
        />
        <div className="px-2"></div>
        <span className="hidden md:block">
          {pool.collateralSymbol}/{pool.debtSymbol}
        </span>
      </th>
      <th className="flex gap-x-1 items-center">
        {roundDown(fee, 2)}%{" "}
        <ToolTip>Fee charged to apes when minting or burning.</ToolTip>
      </th>
      <th className="pl-2">
        <Badge
          {...badgeVariant}
          className="text-[10px]"
        >{`${getLeverageRatio(pool.leverageTier)}x`}</Badge>
      </th>

      <th className="md:col-span-2 flex justify-end items-center gap-x-1 text-right">
        <span>
          {formatNumber(
            parseFloat(formatUnits(parseUnits(pool.totalValueLocked, 0), 18)),
            4,
          )}
        </span>
        <Image
          className="h-5 w-5 rounded-full "
          src={getLogoAsset(pool.collateralToken as `0x${string}`)}
          width={50}
          height={50}
          alt=""
        />
      </th>
    </tr>
  );
}
