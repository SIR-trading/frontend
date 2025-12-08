import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useVaultFilterStore from "@/lib/store";
import { useFindVault } from "./useFindVault";

/**
 * Hook to sync URL with current vault selection.
 * When user changes filters to select a specific vault, updates URL with ?vault=<id>
 * This makes vault selections shareable via URL.
 *
 * Only updates URL when user manually selects a vault through dropdowns.
 * Does not clear URL if a vault from URL doesn't exist.
 */
export function useSyncUrlFromFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { long, versus, leverageTier } = useVaultFilterStore();
  const { result: selectedVault } = useFindVault();
  const lastUrlVaultRef = useRef<string | null>(null);
  const hasUserInteractedRef = useRef(false);

  // Track the vault param from URL
  useEffect(() => {
    const vaultParam = searchParams?.get("vault");
    if (vaultParam !== lastUrlVaultRef.current) {
      lastUrlVaultRef.current = vaultParam;
      // Reset interaction flag when URL changes externally
      hasUserInteractedRef.current = false;
    }
  }, [searchParams]);

  useEffect(() => {
    // Mark as user interaction if filters changed after initial load
    if (long || versus || leverageTier) {
      const currentUrlVault = searchParams?.get("vault");
      // If filters are set but don't match URL, user has interacted
      if (selectedVault) {
        const vaultIdDecimal = parseInt(selectedVault.id).toString();
        if (currentUrlVault !== vaultIdDecimal) {
          hasUserInteractedRef.current = true;
        }
      }
    }
  }, [long, versus, leverageTier, selectedVault, searchParams]);

  useEffect(() => {
    // Only update URL if user has manually interacted with filters
    if (!hasUserInteractedRef.current) {
      return;
    }

    const currentVaultParam = searchParams?.get("vault");

    // If user cleared filters manually, clear URL
    if (!long || !versus || !leverageTier || !selectedVault?.id) {
      if (currentVaultParam) {
        const newParams = new URLSearchParams(searchParams?.toString());
        newParams.delete("vault");
        const newUrl = newParams.toString()
          ? `${window.location.pathname}?${newParams.toString()}`
          : window.location.pathname;
        router.replace(newUrl, { scroll: false });
      }
      return;
    }

    // Convert vault ID from hex to decimal for URL (e.g., "0x10" -> "16")
    const vaultIdDecimal = parseInt(selectedVault.id).toString();

    // Update URL if different
    if (currentVaultParam !== vaultIdDecimal) {
      const newParams = new URLSearchParams(searchParams?.toString());
      newParams.set("vault", vaultIdDecimal);
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      router.replace(newUrl, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [long, versus, leverageTier, selectedVault, router, searchParams]);
}
