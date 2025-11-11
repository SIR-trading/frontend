"use client";

import { useEffect } from "react";
import { CHAIN_CONFIGS } from "@/config/chains";
import { env } from "@/env";

/**
 * Hook that automatically redirects to the appropriate deployment URL
 * when the user switches their wallet to a different network.
 *
 * - On first load: Uses server's NEXT_PUBLIC_CHAIN_ID
 * - When wallet chain changes: Redirects to that chain's deploymentUrl if configured
 *
 * Note: Console errors during redirect (React #423, WebSocket closed) are expected
 * and harmless - they occur because we're navigating away while React/WalletConnect
 * are cleaning up.
 */
export function useNetworkRedirect() {
  useEffect(() => {
    const serverChainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);

      // If the new chain matches the server chain, no redirect needed
      if (newChainId === serverChainId) {
        return;
      }

      // Check if there's a deployment URL for the new chain
      const targetChainConfig = CHAIN_CONFIGS[newChainId];

      if (targetChainConfig?.deploymentUrl && targetChainConfig.deploymentUrl.trim() !== "") {
        // Redirect to the appropriate deployment
        window.location.href = targetChainConfig.deploymentUrl;
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);
}
