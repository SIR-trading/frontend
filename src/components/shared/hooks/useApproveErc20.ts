import { env } from "@/env";
import type { TAddressString } from "@/lib/types";
import { useMemo } from "react";
import { maxUint256 } from "viem";
import { useSimulateContract } from "wagmi";
interface Props {
  tokenAddr: string;
  approveContract: TAddressString;
  amount: bigint;
  allowance: bigint;
  useMaxApprove: boolean;
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
  useMaxApprove,
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
  let approveAmount = needs0Approval ? 0n : amount;
  if (!needs0Approval && useMaxApprove) {
    approveAmount = maxUint256;
  }
  const approveSimulate = useSimulateContract({
    address: tokenAddr as TAddressString,
    abi: nonStandardAbi,
    functionName: "approve",
    args: [approveContract, approveAmount],
  });
  return { approveSimulate, needsApproval, needs0Approval };
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
