import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import useVaultFilterStore from "@/lib/store";
import { api } from "@/trpc/react";

/**
 * Hook to handle vault preselection from URL parameters.
 * Reads ?vault=<id> from URL and sets the appropriate filters in the store.
 * The URL parameter stays in the URL to allow sharing and bookmarking.
 */
export function useVaultFromUrl() {
  const searchParams = useSearchParams();
  const { setAll } = useVaultFilterStore();
  const processedVaultIdRef = useRef<string | null>(null);

  const vaultIdFromUrl = searchParams?.get("vault");

  // Fetch vault details if vaultId is present and hasn't been processed yet
  // Pass the decimal ID directly - the API will handle the conversion
  const { data: vaultData } = api.vault.getVaultById.useQuery(
    { id: vaultIdFromUrl ?? "" },
    {
      enabled: Boolean(vaultIdFromUrl) && vaultIdFromUrl !== processedVaultIdRef.current,
      staleTime: Infinity, // Cache indefinitely
      retry: 1, // Try once more if it fails
    },
  );


  useEffect(() => {
    // If vaultId changes, reset the processed ref
    if (vaultIdFromUrl !== processedVaultIdRef.current) {
      processedVaultIdRef.current = null;
    }
  }, [vaultIdFromUrl]);

  useEffect(() => {
    // Only process if we have vault data and haven't processed this vault ID yet
    if (!vaultData || !vaultIdFromUrl || processedVaultIdRef.current === vaultIdFromUrl) {
      return;
    }

    const vault = vaultData;

    // Set the filters in the store to match this vault
    // Format: setAll(leverageTier, versus, long)
    // Format for versus/long: "address,symbol"
    const leverageTier = vault.leverageTier.toString();
    const versus = `${vault.debtToken.id},${vault.debtToken.symbol}`;
    const long = `${vault.collateralToken.id},${vault.collateralToken.symbol}`;

    setAll(leverageTier, versus, long);

    // Mark this vault ID as processed (using the decimal format from URL)
    processedVaultIdRef.current = vaultIdFromUrl;
  }, [vaultData, vaultIdFromUrl, setAll]);

  return { isLoading: Boolean(vaultIdFromUrl) && !vaultData };
}
