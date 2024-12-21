import Select from "@/components/shared/Select";
import { getLogoAsset } from "@/lib/assets";
import useVaultFilterStore from "@/lib/store";
import type { TMintForm, VaultFieldFragment } from "@/lib/types";
import { getLeverageRatio } from "@/lib/utils/calculations";
import SelectWithSearch from "./selectWithSearch";
interface Props {
  form: TMintForm;
  long: VaultFieldFragment[];
  versus: VaultFieldFragment[];
  leverageTiers: number[];
}
export default function VaultParamsInputSelects({
  form,
  long,
  versus,
  leverageTiers,
}: Props) {
  const setVersus = useVaultFilterStore((store) => store.setVersus);
  const setLong = useVaultFilterStore((store) => store.setLong);
  const setLeverage = useVaultFilterStore((store) => store.setLeverageTier);
  return (
    <div className=" grid gap-x-4 md:grid-cols-3">
      <SelectWithSearch
        name="long"
        title="Go long"
        form={form}
        items={long.map((e) => ({
          label: e.collateralSymbol,
          value: e.collateralToken + "," + e.collateralSymbol,
          imageUrl: getLogoAsset(e.collateralToken as `0x${string}`),
        }))}
      />
      <SelectWithSearch
        name="versus"
        title="Versus"
        form={form}
        items={versus.map((e) => ({
          label: e.debtSymbol,
          value: e.debtToken + "," + e.debtSymbol,
          imageUrl: getLogoAsset(e.debtToken as `0x${string}`),
        }))}
      />
      <Select
        placeholder="Select Tier"
        setStore={setLeverage}
        items={leverageTiers.map((e) => ({
          label: getLeverageRatio(e).toString() + "x",
          value: e.toString(),
        }))}
        noSearch
        name="leverageTier"
        title="Leverage Tier"
        form={form}
      />
    </div>
  );
}
