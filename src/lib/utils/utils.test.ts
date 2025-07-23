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
test("Test Format Number", () => {
  expect(formatNumber(333999000)).toBe("333M");
  expect(formatNumber(33999000)).toBe("33.9M");
  expect(formatNumber(3999000)).toBe("3.99M");
  expect(formatNumber(433.242)).toBe("433");
  expect(formatNumber(43.242)).toBe("43.2");
  expect(formatNumber(10000)).toBe("10K");
  expect(formatNumber(10000000)).toBe("10M");
  expect(formatNumber(0.001222)).toBe("0.00122");
  expect(formatNumber(933.23)).toBe("933");
  expect(formatNumber(0.1226865213)).toBe("0.122");
  expect(formatNumber(1.0001)).toBe("1");
  expect(formatNumber(21.11)).toBe("21.1");
  expect(formatNumber(0.00012323)).toBe("1.2323e-4");
  expect(formatNumber(0.0000001)).toBe("1e-7");
  expect(formatNumber(0)).toBe("0");
  expect(formatNumber(0.0133333)).toBe("0.0133");
});
