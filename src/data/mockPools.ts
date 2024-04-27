import { LeverageTier, TPool } from "@/lib/types";

export const mockPools: TPool[] = [
  {
    debtToken: "0x0",
    collateralToken: "0x1",
    leverageTier: LeverageTier.one,
    vaultId: "123",
    name: "",
    symbol: "",
  },
  {
    debtToken: "0x2",
    collateralToken: "0x3",
    leverageTier: LeverageTier.two,
    vaultId: "123",
    name: "",
    symbol: "",
  },
  {
    debtToken: "0x2",
    collateralToken: "0x5",
    leverageTier: LeverageTier.two,
    vaultId: "123",
    name: "",
    symbol: "",
  },
  {
    debtToken: "0x6",
    collateralToken: "0x7",
    leverageTier: LeverageTier.two,
    vaultId: "123",
    name: "",
    symbol: "",
  },
  {
    debtToken: "0x8",
    collateralToken: "0x7",
    leverageTier: LeverageTier.three,
    vaultId: "123",
    name: "",
    symbol: "",
  },
];