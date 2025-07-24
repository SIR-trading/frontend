import { parseAddress } from "@/lib/utils/index";

export function usingDebtToken(versus: string, depositToken: string) {
  if (depositToken === parseAddress(versus) && depositToken !== "") {
    return true;
  } else {
    return false;
  }
}
