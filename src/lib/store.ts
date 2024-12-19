import { create } from "zustand";

interface StoreVaultFilter {
  long: string;
  versus: string;
  leverageTier: string;
  setLong: (long: string) => void;
  setVersus: (versus: string) => void;
  setLeverageTier: (leverageTier: string) => void;
  setAll: (leverageTier: string, versus: string, long: string) => void;
  resetStore: () => void;
}

const useVaultFilterStore = create<StoreVaultFilter>((set) => ({
  long: "",
  versus: "",
  leverageTier: "",
  setLong: (long) => set({ long }),
  setVersus: (versus) => set({ versus }),
  setLeverageTier: (leverageTier) => set({ leverageTier }),
  setAll: (leverageTier, versus, long) => set({ leverageTier, versus, long }),
  resetStore: () => set({ leverageTier: "", versus: "", long: "" }),
}));

export default useVaultFilterStore;
