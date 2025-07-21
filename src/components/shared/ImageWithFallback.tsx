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
    if (fallbackAttempts === 0 && secondaryFallbackUrl) {
      // First fallback: try secondary fallback URL (logoURI from assets.json)
      setImgSrc(secondaryFallbackUrl);
      setFallbackAttempts(1);
    } else if (fallbackAttempts <= 1 && fallbackImageUrl) {
      // Second fallback: use provided fallback
      setImgSrc(fallbackImageUrl);
      setFallbackAttempts(2);
    } else {
      // Final fallback: unknown image
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
      />
    );
  }
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image
      {...imgProps}
      src={src}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;
