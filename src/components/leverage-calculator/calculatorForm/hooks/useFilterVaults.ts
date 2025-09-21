import type { TCalculatorFormFields } from "@/components/providers/calculatorFormProvider";
import type { TVaults, VaultFieldFragment } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useVaultData } from "@/contexts/VaultDataContext";

interface Props {
  vaultsQuery: TVaults;
}
/**
 * Narrows down dropdown items(vaults) when other dropdowns are selected.
 */
export function useFilterVaults({ vaultsQuery }: Props) {
  const form = useFormContext<TCalculatorFormFields>();
  const formData = form.watch();
  const { allVaults } = useVaultData();

  // Skip filtering if fields are not selected
  const skipQuery = !formData.versus && !formData.long && !formData.leverageTier;

  // Filter vaults using the context data instead of making a new query
  const data = useMemo(() => {
    if (!allVaults || skipQuery) return undefined;

    const filtered = allVaults.filter(vault => {
      if (formData.versus && vault.debtToken !== formData.versus.split(",")[0]) return false;
      if (formData.long && vault.collateralToken !== formData.long.split(",")[0]) return false;
      if (formData.leverageTier && vault.leverageTier !== parseInt(formData.leverageTier)) return false;
      return true;
    });

    return { vaults: filtered };
  }, [allVaults, formData.versus, formData.long, formData.leverageTier, skipQuery]);

  const isFetching = false; // No longer fetching since we're using context data
  const [filters, setFilters] = useState<{
    versus: VaultFieldFragment[];
    long: VaultFieldFragment[];
    leverageTiers: number[];
  }>({
    long: [],
    versus: [],
    leverageTiers: [],
  });
  // have a second query for address searches

  // turn into a set
  // all unique values

  useEffect(() => {
    // When no fields are selected, use all vaults from vaultsQuery
    // Otherwise use the filtered data from the query
    const vaultsToUse = skipQuery ? vaultsQuery?.vaults : data?.vaults;
    
    if (!vaultsToUse) {
      return;
    }
    
    const matchingFetchPools = vaultsToUse;
    const long = [
      ...new Map(
        matchingFetchPools?.map((item) => [item.collateralToken, item]),
      ).values(),
    ];
    const versus = [
      ...new Map(
        matchingFetchPools?.map((item) => [item.debtToken, item]),
      ).values(),
    ];
    const leverageTiers = [
      ...new Set(matchingFetchPools?.map((p) => p.leverageTier)),
    ];

    setFilters({ long, versus, leverageTiers });
    // return { leverageTiers, long, versus };
  }, [data?.vaults, isFetching, vaultsQuery?.vaults, skipQuery]);
  const { versus, leverageTiers, long } = filters;
  return { versus, leverageTiers, long };
}

// --=== Deprecated Logic without query ==--
//
// const matchingPools = vaultsQuery?.vaults.filter((p) => {
//   if (formData.leverageTier) {
//     if (p.leverageTier !== parseInt(formData.leverageTier)) {
//       return false;
//     }
//   }
//   if (formData.long) {
//     if (formData.long.split(",")[0] !== p.collateralToken) {
//       return false;
//     }
//   }
//   if (formData.versus) {
//     if (formData.versus.split(",")[0] !== p.debtToken) {
//       return false;
//     }
//   }
//   return true;
// });
