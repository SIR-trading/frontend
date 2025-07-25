import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import unknownImg from "@/../public/IconUnknown.png";
// Todo
// Extend image props
interface Props {
  src: string | StaticImageData;
  alt: string;
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
  fill?: boolean | undefined;
  quality?: number | `${number}` | undefined;
  priority?: boolean | undefined;
  loading?: "eager" | "lazy" | undefined;
  blurDataURL?: string | undefined;
  unoptimized?: boolean | undefined;
  overrideSrc?: string | undefined;
  layout?: string | undefined;
  objectFit?: string | undefined;
  objectPosition?: string | undefined;
  lazyBoundary?: string | undefined;
  lazyRoot?: string | undefined;
  className?: string | undefined;
  fallbackImageUrl?: string | StaticImageData;
  secondaryFallbackUrl?: string; // Additional fallback before final unknown image
}

const ImageWithFallback = (props: Props) => {
  const { fallbackImageUrl, secondaryFallbackUrl } = props;
  const { src, ...rest } = props;
  const [imgSrc, setImgSrc] = useState<string | StaticImageData | undefined>(
    undefined,
  );
  const [fallbackAttempts, setFallbackAttempts] = useState(0);
  
  useEffect(() => {
    setImgSrc(src);
    setFallbackAttempts(0);
  }, [src]);
  
  const imgProps = { ...rest };
  delete imgProps.fallbackImageUrl;
  delete imgProps.secondaryFallbackUrl;
  
  const handleError = () => {
    // Debug logging for Rekt token
    if (typeof src === "string" && src.includes("0xdd3b11ef34cd511a2da159034a05fcb94d806686")) {
      console.log("ImageWithFallback error for REKT:", {
        fallbackAttempts,
        secondaryFallbackUrl,
        fallbackImageUrl,
        currentSrc: imgSrc,
        originalSrc: src
      });
    }
    
    if (fallbackAttempts === 0 && secondaryFallbackUrl) {
      // First fallback: try secondary fallback URL (logoURI from assets.json)
      console.log("Trying secondary fallback:", secondaryFallbackUrl);
      setImgSrc(secondaryFallbackUrl);
      setFallbackAttempts(1);
    } else if (fallbackAttempts <= 1 && fallbackImageUrl) {
      // Second fallback: use provided fallback
      console.log("Trying provided fallback:", fallbackImageUrl);
      setImgSrc(fallbackImageUrl);
      setFallbackAttempts(2);
    } else {
      // Final fallback: unknown image
      console.log("Using final fallback: unknown image");
      setImgSrc(unknownImg as string | StaticImageData);
      setFallbackAttempts(3);
    }
  };
  
  if (imgSrc) {
    return (
      // eslint-disable-next-line jsx-a11y/alt-text
      <Image
        {...imgProps}
        src={imgSrc}
        onError={handleError}
        unoptimized={typeof imgSrc === "string" && imgSrc.startsWith("http")}
      />
    );
  }
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...imgProps}
      src={src}
      onError={handleError}
      unoptimized={typeof src === "string" && src.startsWith("http")}
    />
  );
};

export default ImageWithFallback;
