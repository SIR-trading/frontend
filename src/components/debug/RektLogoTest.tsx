import React from 'react';
import { useTokenLogo } from '@/hooks/useTokenLogo';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { Address } from 'viem';

/**
 * Debug component to test Rekt token logo fallback
 * Add this temporarily to any page to test the logo system
 */
export function RektLogoTest() {
  const rektAddress = "0xdd3b11ef34cd511a2da159034a05fcb94d806686" as Address;
  const { primary, fallback } = useTokenLogo(rektAddress, "1");
  
  console.log("RektLogoTest:", { primary, fallback });
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Rekt Logo Test</h3>
      <p>Primary: {typeof primary === 'string' ? primary : 'StaticImageData'}</p>
      <p>Fallback: {fallback ?? 'undefined'}</p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <ImageWithFallback
          src={primary}
          secondaryFallbackUrl={fallback}
          width={40}
          height={40}
          alt="Rekt logo test"
          className="border border-black"
        />
        <span>REKT Token Logo</span>
      </div>
    </div>
  );
}
