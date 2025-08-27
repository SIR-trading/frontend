import { create } from "zustand";

interface StoreVaultFilter {
  long: string;
  versus: string;
  leverageTier: string;
  depositToken: string;
  setLong: (long: string) => void;
  setVersus: (versus: string) => void;
  setLeverageTier: (leverageTier: string) => void;
  setDepositToken: (depositToken: string) => void;
  setAll: (leverageTier: string, versus: string, long: string) => void;
  resetStore: () => void;
}

const useVaultFilterStore = create<StoreVaultFilter>((set) => ({
  long: "",
  versus: "",
  leverageTier: "",
  depositToken: "",
  setLong: (long) => set({ long }),
  setVersus: (versus) => set({ versus }),
  setLeverageTier: (leverageTier) => set({ leverageTier }),
  setDepositToken: (depositToken) => set({ depositToken }),
  setAll: (leverageTier, versus, long) => set({ leverageTier, versus, long }),
  resetStore: () => set({ leverageTier: "", versus: "", long: "", depositToken: "" }),
}));

export default useVaultFilterStore;
