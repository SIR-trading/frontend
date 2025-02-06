import type { TMintFormFields } from "@/components/providers/mintFormProvider";
import type { TVaults, VaultFieldFragment } from "@/lib/types";
import { api } from "@/trpc/react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

interface Props {
  vaultsQuery: TVaults;
}
/**
 * Narrows down dropdown items(vaults) when other dropdowns are selected.
 */
export function useFilterVaults({ vaultsQuery }: Props) {
  const form = useFormContext<TMintFormFields>();
  const formData = form.watch();
  const { data, isFetching } = api.vault.getVaults.useQuery({
    filterDebtToken: formData.versus.split(",")[0],
    filterCollateralToken: formData.long.split(",")[0],
    filterLeverage: formData.leverageTier,
  });
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
    if (!data?.vaults) {
      return;
    }
    const matchingFetchPools = data?.vaults;
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
  }, [data?.vaults, isFetching, vaultsQuery?.vaults]);
  const { versus, leverageTiers, long } = filters;
  console.log(long, "LONG");
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
