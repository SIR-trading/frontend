import { beforeAll, expect, test } from "vitest";
import { add, formatNumber } from "./index";
import {
  calculateApr,
  calculateMaxApe,
  getLeverageRatio,
} from "./calculations";
import dotenv from "dotenv";
import { parseUnits } from "viem";

beforeAll(() => {
  dotenv.config();
});
test("Test utils add function.", () => {
  expect(add(1, 2)).toBe(3);
});

test("Test calculate leverage tier ratio.", () => {
  expect(getLeverageRatio(-1)).toBe(1.5);
});

// test("Test if getApeAddress gets proper contract address.", () => {
//   expect(
//     getApeAddress({
//       vaultId: 1,
//       vaultAddress: "0xa51807d5a12E7e78148c66dC4851CD33EEd1FDfD",
//       apeHash:
//         "0xa46131919dce26b89fa279578c126634abe8d3a1a5924b214543dfa2e12b3b86",
//     }),
//   ).toBe("0x067Dd26fecdf6659879D0a1a4C4DFa735413339D".toLowerCase()); // FOR SOME REASON VITE DOESN"T WORK WITH getAddress
// });

test("Apr Calculation", () => {
  expect(
    calculateApr({
      amountOfStakedSir: parseUnits("100", 12),
      ethDividends: parseUnits("1", 18),
      sirUsdPrice: "1",
      ethUsdPrice: "200",
    }),
  ).toBe(200n * 12n);
});
test("Calculate Maximum Ape", () => {
  expect(
    calculateMaxApe({
      leverageTier: 2n,
      baseFee: 1n,
      apeReserve: 1000n,
      gentlemenReserve: 10000n,
    }),
  ).toBe(1000n);

  expect(
    calculateMaxApe({
      leverageTier: -2n,
      baseFee: 1n,
      apeReserve: 1000n,
      gentlemenReserve: 10000n,
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
