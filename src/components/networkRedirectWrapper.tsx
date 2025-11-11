"use client";

import { useNetworkRedirect } from "@/hooks/useNetworkRedirect";

/**
 * Client component that wraps the network redirect hook.
 * This allows the hook to be used in the server-side layout.
 */
export function NetworkRedirectWrapper() {
  useNetworkRedirect();
  return null;
}
