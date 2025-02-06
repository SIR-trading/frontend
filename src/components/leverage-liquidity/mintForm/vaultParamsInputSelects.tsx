import Select from "@/components/shared/Select";
import { getLogoAsset } from "@/lib/assets";
import useVaultFilterStore from "@/lib/store";
import type { VaultFieldFragment } from "@/lib/types";
import { getLeverageRatio } from "@/lib/utils/calculations";
import SelectWithSearch from "./selectWithSearch";
import { useMemo } from "react";
import Show from "@/components/shared/show";
import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import { useFormContext } from "react-hook-form";
interface Props {
  long: VaultFieldFragment[];
  versus: VaultFieldFragment[];
  leverageTiers: number[];
}
export default function VaultParamsInputSelects({
  long,
  versus,
  leverageTiers,
}: Props) {
  const setLeverage = useVaultFilterStore((store) => store.setLeverageTier);
  const { watch, reset } = useFormContext<TMintFormFields>();
  const formData = watch();
  const allSelected = useMemo(() => {
    if (formData.long || formData.versus || formData.leverageTier) {
      return true;
    } else {
      return false;
    }
  }, [formData.leverageTier, formData.long, formData.versus]);
  const resetStore = useVaultFilterStore((store) => store.resetStore);
  return (
    <div className="relative grid gap-x-4 pb-2 md:grid-cols-3">
      <Show when={allSelected}>
        <button
          type="button"
          onClick={() => {
            reset();
            resetStore();
          }}
          className="absolute -bottom-3 right-0 rounded-md bg-red p-[4px]  text-sm leading-none"
        >
          clear
        </button>
      </Show>

      <SelectWithSearch
        name="long"
        title="Go long"
        items={long.map((e) => ({
          label: e.collateralSymbol,
          value: e.collateralToken + "," + e.collateralSymbol,
          imageUrl: getLogoAsset(e.collateralToken as `0x${string}`),
        }))}
      />
      <SelectWithSearch
        name="versus"
        title="Versus"
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
      />
    </div>
  );
}
