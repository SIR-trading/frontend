"use client";

import { Suspense } from "react";
import { useVaultFromUrl } from "./hooks/useVaultFromUrl";
import { useSyncUrlFromFilters } from "./hooks/useSyncUrlFromFilters";

/**
 * Component that handles vault URL synchronization.
 * Wrapped in Suspense to handle useSearchParams() requirement for SSR.
 */
function VaultUrlSyncInner() {
  // Handle vault preselection from URL params
  useVaultFromUrl();

  // Sync URL when user changes vault filters (for shareability)
  useSyncUrlFromFilters();

  return null;
}

/**
 * Wrapper component with Suspense boundary for URL sync functionality
 */
export function VaultUrlSync() {
  return (
    <Suspense fallback={null}>
      <VaultUrlSyncInner />
    </Suspense>
  );
}
