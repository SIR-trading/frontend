import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import unknownImg from "@/../public/IconUnknown.png";

interface SmartImageProps {
  primarySrc: string | StaticImageData;
  fallbackSrc?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Smart image component that preloads images to check availability
 * before using Next.js Image component
 */
export function SmartImage({
  primarySrc,
  fallbackSrc,
  alt,
  width = 40,
  height = 40,
  className,
}: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | StaticImageData>(primarySrc);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset when primarySrc changes
    setCurrentSrc(primarySrc);
    setIsLoading(true);

    // If it's a StaticImageData object, use it directly
    if (typeof primarySrc !== "string") {
      setIsLoading(false);
      return;
    }

    // Try to preload the primary image
    const img = document.createElement('img');
    img.onload = () => {
      setCurrentSrc(primarySrc);
      setIsLoading(false);
    };
    img.onerror = () => {
      console.log(`Primary image failed: ${primarySrc}, trying fallback: ${fallbackSrc}`);
      if (fallbackSrc) {
        // Try the fallback
        const fallbackImg = document.createElement('img');
        fallbackImg.onload = () => {
          setCurrentSrc(fallbackSrc);
          setIsLoading(false);
        };
        fallbackImg.onerror = () => {
          console.log(`Fallback image also failed: ${fallbackSrc}, using unknown image`);
          setCurrentSrc(unknownImg);
          setIsLoading(false);
        };
        fallbackImg.src = fallbackSrc;
      } else {
        setCurrentSrc(unknownImg);
        setIsLoading(false);
      }
    };
    img.src = primarySrc;
  }, [primarySrc, fallbackSrc]);

  if (isLoading) {
    return (
      <div 
        className={`${className} bg-gray-200 animate-pulse`}
        style={{ width, height }}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={typeof currentSrc === "string"}
    />
  );
}
