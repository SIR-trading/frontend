import Select from "@/components/shared/Select";
import type { TMintForm, VaultFieldFragment } from "@/lib/types";
import { getLeverageRatio, getLogoAsset } from "@/lib/utils";
interface Props {
  form: TMintForm;
  long: VaultFieldFragment[];
  versus: VaultFieldFragment[];
  leverageTiers: number[];
}
export default function TopSelects({
  form,
  long,
  versus,
  leverageTiers,
}: Props) {
  return (
    <div className=" grid gap-x-4 md:grid-cols-3">
      <Select
        name="long"
        title="Go long:"
        form={form}
        items={long.map((e) => ({
          label: e.collateralSymbol,
          value: e.collateralToken + "," + e.collateralSymbol,
          imageUrl: getLogoAsset(e.collateralToken as `0x${string}`),
        }))}
      />
      <Select
        name="versus"
        title="Versus:"
        form={form}
        items={versus.map((e) => ({
          label: e.debtSymbol,
          value: e.debtToken + "," + e.debtSymbol,
          imageUrl: getLogoAsset(e.debtToken as `0x${string}`),
        }))}
      />
      <Select
        placeholder="Select Tier"
        items={leverageTiers.map((e) => ({
          label: getLeverageRatio(e).toString() + "x",
          value: e.toString(),
        }))}
        noSearch
        name="leverageTier"
        title="Leverage Tier:"
        form={form}
      />
    </div>
  );
}
