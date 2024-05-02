import { LeverageTiers } from "@/data/constants";
import { mockPools } from "@/data/mockPools";
import { type LeverageTier, type TPool } from "@/lib/types";
import { useMemo } from "react";

interface Props {
  formData: {
    long: string;
    versus: string;
    leverageTier: string;
    depositToken: string;
    deposit: number;
  };
}
/**
 * Narrows down dropdown items when other dropdowns are select.
 */
export function useSelectMemo({ formData }: Props) {
  const { versus, leverageTiers, long } = useMemo(() => {
    const matchingPools = mockPools.filter((p) => {
      if (formData.leverageTier) {
        if (
          LeverageTiers[p.leverageTier] !==
          LeverageTiers[parseInt(formData.leverageTier) as LeverageTier]
        ) {
          return false;
        }
      }
      if (formData.versus) {
        if (formData.versus !== p.collateralToken) {
          return false;
        }
      }
      if (formData.long) {
        if (formData.long !== p.debtToken) {
          return false;
        }
      }
      return true;
    });

    const versus = [...new Set(matchingPools.map((p) => p.collateralToken))];
    const long = [...new Set(matchingPools.map((p) => p.debtToken))];
    const leverageTiers = [
      ...new Set(matchingPools.map((p) => p.leverageTier)),
    ];
    return { leverageTiers, long, versus };
  }, [formData]);
  return { versus, leverageTiers, long };
}

// enum DropsList {
//   "leverageTier" = 1,
//   "versus" = 2,
//   "long" = 3,
// }

// const [matchingPools, setMatchingPools] = useState<TPool[]>(mockPools);
// const [firstSelected, setfirstSelected] = useState<DropsList | undefined>();
// const [secondSelected, setSecondSelected] = useState<DropsList | undefined>();
// useEffect(() => {
//   // TODO
//   // CHECK IF firstSelected IS ALREADY SET
//   if (firstSelected) return;
//   if (formData.leverageTier) {
//     const newPools = mockPools.filter(
//       (p) =>
//         LeverageTiers[p.leverageTier] ===
//         LeverageTiers[parseInt(formData.leverageTier) as LeverageTier],
//     );
//     setfirstSelected(DropsList.leverageTier);
//     setMatchingPools(newPools);
//   }
//   if (formData.versus) {
//     const newPools = mockPools.filter(
//       (p) => p.collateralToken === formData.versus,
//     );

//     setfirstSelected(DropsList.versus);
//     setMatchingPools(newPools);
//   }
//   if (formData.long) {
//     const newPools = mockPools.filter((p) => {
//       return p.debtToken === formData.long;
//     });

//     setfirstSelected(DropsList.long);
//     setMatchingPools(newPools);
//   }
// }, [formData.leverageTier, formData.versus, formData.long]);

// // remove firstSelected if they are now undefined/null
// useEffect(() => {
//   if (!firstSelected) return;
//   if (firstSelected === DropsList.leverageTier) {
//     if (!formData.leverageTier) {
//       setfirstSelected(undefined);
//       setMatchingPools(mockPools);
//     } else {
//       const newPools = mockPools.filter(
//         (p) =>
//           LeverageTiers[p.leverageTier] ===
//           LeverageTiers[parseInt(formData.leverageTier) as LeverageTier],
//       );
//       setMatchingPools(newPools);
//       setSecondSelected(undefined);
//     }
//   }
//   if (firstSelected === DropsList.versus && !formData.versus) {
//     setfirstSelected(undefined);
//     setMatchingPools(mockPools);
//   }
//   if (firstSelected === DropsList.long && !formData.long) {
//     setfirstSelected(undefined);
//     setMatchingPools(mockPools);
//   }
// }, [formData.leverageTier, formData.versus, formData.long, firstSelected]);

// // Find selections for all dropdowns
// const { versus, leverageTiers, long } = useMemo(() => {
//   // TODO
//   // also filter for second option selected
//   // check if select is firstSelected select
//   let leverageTiers: LeverageTier[] = [];
//   let versus: string[] = [];
//   let long: string[] = [];

//   if (firstSelected !== DropsList.leverageTier) {
//     const leverageArr = matchingPools.map((e) => e.leverageTier);
//     // Get Unique leverage tiers
//     leverageTiers = [...new Set(leverageArr)];
//   } else {
//     const leverageArr = mockPools.map((e) => e.leverageTier);
//     // Get Unique leverage tiers
//     leverageTiers = [...new Set(leverageArr)];
//   }

//   if (firstSelected !== DropsList.versus) {
//     versus = matchingPools.map((e) => {
//       return e.collateralToken;
//     });
//   } else {
//     versus = mockPools.map((e) => e.collateralToken);
//   }

//   if (firstSelected !== DropsList.long) {
//     long = matchingPools.map((e) => {
//       return e.debtToken;
//     });
//   } else {
//     long = mockPools.map((e) => {
//       return e.debtToken;
//     });
//   }

//   return { versus, leverageTiers, long };
// }, [matchingPools, parent]);