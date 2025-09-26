import { getDexName } from "@/lib/chains";

export function getReadableErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // Check for specific errors and provide user-friendly messages
  if (message.includes("NoUniswapPool") || message.includes("0x94113d81")) {
    return `No ${getDexName()} liquidity pool exists for this token pair. Please choose tokens with existing liquidity pools.`;
  }

  if (message.includes("user rejected") || message.includes("User denied") || message.includes("rejected the request")) {
    return "Transaction was cancelled.";
  }

  if (message.includes("Internal JSON-RPC error") || message.includes("internal error")) {
    return "Network error. Please try again.";
  }

  if (message.includes("insufficient funds") || message.includes("insufficient balance")) {
    return "Insufficient funds for this transaction.";
  }

  if (message.includes("nonce too low")) {
    return "Transaction nonce error. Please refresh and try again.";
  }

  if (message.includes("gas")) {
    return "Gas estimation failed. Please try again.";
  }

  if (message.includes("revert")) {
    return "Transaction would fail. Please check your inputs.";
  }

  // Generic fallback - never show technical details
  return "Transaction failed. Please try again.";
}