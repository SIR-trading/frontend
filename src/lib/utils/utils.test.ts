import { beforeAll, expect, test } from "vitest";
import { add, formatNumber } from "./index";
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

test("Format very small number", () => {
  const result = formatNumber("0.000000000003", 3);
  console.log("formatNumber result:", result);
  expect(typeof result).toBe("object");
  if (typeof result === "object") {
    expect(result.type).toBe("small");
    expect(result.zeroCount).toBe(11);
    expect(result.sigDigits).toBe("3"); // Should be just "3", not "300"
  }
});
