import { env } from "@/env";
import type { TAddressString } from "@/lib/types";
import { useMemo } from "react";
import { useSimulateContract } from "wagmi";
interface Props {
  tokenAddr: string;
  approveContract: TAddressString;
  amount: bigint;
  allowance: bigint;
}
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
export function useApproveErc20({
  amount,
  allowance,
  tokenAddr,
  approveContract,
}: Props) {
  // needs to check for 0 approval for usdt edge case
  const needs0Approval = useMemo(() => {
    if (allowance === undefined) {
      return false;
    }
    if (allowance > 0n && tokenAddr === USDT_ADDRESS && allowance < amount) {
      return true;
    }
  }, [allowance, amount, tokenAddr]);
  const needsApproval = useMemo(() => {
    if (tokenAddr === "") return false;
    if ((allowance ?? 0n) < amount) {
      return true;
    }
    return false;
  }, [allowance, amount, tokenAddr]);
  const approveAmount = needs0Approval ? 0n : amount;
  const approveSimulate = useSimulateContract({
    address: tokenAddr as TAddressString,
    abi: getAbi(tokenAddr as TAddressString),
    functionName: "approve",
    args: [approveContract, approveAmount],
  });
  return { approveSimulate, needsApproval, needs0Approval };
}
const USDT =
  env.NEXT_PUBLIC_CHAIN_ID === "1"
    ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    : "0x89976b5214377a45643E6dD3c5C60b5098e7B9d7";
function getAbi(tokenAddr: TAddressString) {
  if (tokenAddr.toLowerCase() === USDT.toLowerCase()) {
    return nonStandardAbi;
  } else {
    return nonStandardAbi;
  }
}
const nonStandardAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
];
