import { beforeAll, expect, test } from "vitest";
import dotenv from "dotenv";
import { calculateVaultHealth } from "./useCalculateVaultHealth";
beforeAll(() => {
  dotenv.config();
});

test("Testing calculating vault health.", () => {
  const leverageTier = 0,
    teaCollateral = 220n,
    apeCollateral = 100n;
  expect(
    calculateVaultHealth({
      leverageTier,
      teaCollateral,
      apeCollateral,
      isApe: true,
    }).variant,
  ).toBe("green");
  expect(
    calculateVaultHealth({
      leverageTier: -1,
      teaCollateral: 49304565809899447n,
      apeCollateral: 73381955552671381n,
      isApe: true,
    }).variant,
  ).toBe("green");
});
test("Testing Zero values", () => {
  expect(
    calculateVaultHealth({
      leverageTier: -1,
      teaCollateral: 0n,
      apeCollateral: 0n,
      isApe: true,
    }).variant,
  ).toBe("red");
});
