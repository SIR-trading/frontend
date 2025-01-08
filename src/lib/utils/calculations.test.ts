import { expect, test } from "vitest";
import { calculateApeVaultFee } from "./calculations";
import { L_FEE } from "@/data/constants";

test("Test calculate leverage tier ratio.", () => {
  expect(calculateApeVaultFee(-1)).toBe(0.243856332703);
});
