import React from "react";
import { useTokenLogo } from "@/hooks/useTokenLogo";
import ImageWithFallback from "./ImageWithFallback";
import type { Address } from "viem";

interface TokenImageProps {
  address: Address | undefined;
  chainId?: string;
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/**
 * Enhanced token image component that automatically handles fallbacks:
 * 1. Trust Wallet assets repository
 * 2. logoURI from assets.json
 * 3. Unknown token icon
 */
export function TokenImage({
  address,
  chainId,
  className,
  width = 24,
  height = 24,
  alt = "Token logo"
}: TokenImageProps) {
  const { primary, fallback } = useTokenLogo(address, chainId);

  return (
    <ImageWithFallback
      className={className}
      src={primary}
      secondaryFallbackUrl={fallback}
      width={width}
      height={height}
      alt={alt}
    />
  );
}
