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
const USDT_ADDRESS =
  env.NEXT_PUBLIC_CHAIN_ID === "1"
    ? "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    : "0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0";
export function useApproveErc20({
  amount,
  allowance,
  tokenAddr,
  approveContract,
}: Props) {
  console.log(tokenAddr === USDT_ADDRESS, tokenAddr, USDT_ADDRESS);
  const needs0Approval = useMemo(() => {
    if (allowance === undefined) {
      return false;
    }
    if (
      allowance > 0n &&
      tokenAddr.toLowerCase() === USDT_ADDRESS.toLowerCase() &&
      allowance < amount
    ) {
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
    abi: nonStandardAbi,
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
