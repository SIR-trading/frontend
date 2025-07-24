import { beforeAll, expect, test } from "vitest";
import { add } from "./index";
import {
  calculateMaxApe,
  getLeverageRatio,
} from "./calculations";
import dotenv from "dotenv";

beforeAll(() => {
  dotenv.config();
});
test("Test utils add function.", () => {
  expect(add(1, 2)).toBe(3);
});

test("Test calculate leverage tier ratio.", () => {
  expect(getLeverageRatio(-1)).toBe(1.5);
});

test("Calculate Maximum Ape", () => {
  expect(
    calculateMaxApe({
      leverageTier: 2n,
      baseFeeBigInt: 1n,
      apeReserve: 1000n,
      gentlemenReserve: 10000n,
      taxAmountBigInt: 0n,
    }),
  ).toBe(1000n);

  expect(
    calculateMaxApe({
      leverageTier: -2n,
      baseFeeBigInt: 1n,
      apeReserve: 1000n,
      gentlemenReserve: 10000n,
      taxAmountBigInt: 0n,
    }),
  ).toBe(31003n);
});
