import Select from "@/components/shared/Select";
import { useTokenlistContext } from "@/contexts/tokenListProvider";
import useVaultFilterStore from "@/lib/store";
import type { VaultFieldFragment } from "@/lib/types";
import { getLeverageRatio } from "@/lib/utils/calculations";
import SelectWithSearch from "./selectWithSearch";
import { useMemo } from "react";
import Show from "@/components/shared/show";
import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
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
  const { watch, reset } = useFormContext<TCalculatorFormFields>();
  const { tokenlist } = useTokenlistContext();
  
  const formData = watch();
  const storeLong = useVaultFilterStore((state) => state.long);
  const storeVersus = useVaultFilterStore((state) => state.versus);
  const storeLeverageTier = useVaultFilterStore((state) => state.leverageTier);
  
  const allSelected = useMemo(() => {
    // Check if any field has a non-empty value
    return Boolean(
      formData.long || 
      formData.versus || 
      formData.leverageTier ||
      storeLong ||
      storeVersus ||
      storeLeverageTier
    );
  }, [formData.leverageTier, formData.long, formData.versus, 
      storeLong, storeVersus, storeLeverageTier]);
  
  // Helper function to get logo with fallback from tokenlist
  const getLogoWithFallback = (address: string) => {
    // First try to find from tokenlist (which has curated logoURIs)
    const token = tokenlist?.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );
    if (token?.logoURI) {
      return token.logoURI;
    }
    // Fall back to Trust Wallet
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
  };
  
  const resetStore = useVaultFilterStore((store) => store.resetStore);
  return (
    <div className="relative grid gap-x-4 pb-5 pt-4 md:grid-cols-3">
      <Show when={allSelected}>
        <button
          type="button"
          onClick={() => {
            reset({
              long: "",
              versus: "",
              leverageTier: "",
              deposit: "",
              slippage: "0.5",
              depositToken: "",
              entryPrice: "",
              exitPrice: "",
            });
            resetStore();
          }}
          className="absolute bottom-0 right-0 rounded-md bg-red px-2 py-1 text-sm leading-none text-white hover:bg-red/90 transition-colors"
        >
          Clear all
        </button>
      </Show>

      <SelectWithSearch
        name="long"
        title="Go long"
        items={long.map((e) => ({
          label: e.collateralToken.symbol ?? 'Unknown',
          value: e.collateralToken.id + "," + (e.collateralToken.symbol ?? 'Unknown'),
          imageUrl: getLogoWithFallback(e.collateralToken.id),
        }))}
      />
      <SelectWithSearch
        name="versus"
        title="Versus"
        items={versus.map((e) => ({
          label: e.debtToken.symbol ?? 'Unknown',
          value: e.debtToken.id + "," + (e.debtToken.symbol ?? 'Unknown'),
          imageUrl: getLogoWithFallback(e.debtToken.id),
        }))}
      />
      <Select
        placeholder="Select Leverage"
        setStore={setLeverage}
        items={leverageTiers.map((e) => ({
          label: "^" + getLeverageRatio(e).toString(),
          value: e.toString(),
        }))}
        noSearch
        name="leverageTier"
        title="Leverage"
      />
    </div>
  );
}
