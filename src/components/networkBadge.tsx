"use client";
import { useMemo } from "react";
import { env } from "@/env";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface NetworkBadgeProps {
  className?: string;
  variant?: "full" | "compact" | "minimal";
}

export default function NetworkBadge({
  className,
  variant = "full",
}: NetworkBadgeProps) {
  // Determine if we're on a HyperEVM chain
  const isHyperEVM = useMemo(() => {
    const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);
    return chainId === 998 || chainId === 999;
  }, []);

  const networkInfo = useMemo(() => {
    if (isHyperEVM) {
      return {
        displayName: "HyperEVM",
        imageSrc: "/built_on_hyperevm.jpg",
      };
    }
    return {
      displayName: "Ethereum",
      imageSrc: "/built_on_ethereum.jpg",
    };
  }, [isHyperEVM]);

  // Render minimal variant (smaller image)
  if (variant === "minimal") {
    return (
      <div className={cn("relative", className)}>
        <Image
          src={networkInfo.imageSrc}
          alt={`Built on ${networkInfo.displayName}`}
          width={40}
          height={40}
        />
      </div>
    );
  }

  // Render compact variant (medium image)
  if (variant === "compact") {
    return (
      <div className={cn("relative", className)}>
        <Image
          src={networkInfo.imageSrc}
          alt={`Built on ${networkInfo.displayName}`}
          width={60}
          height={60}
        />
      </div>
    );
  }

  // Render full variant (default)
  return (
    <div className={cn("relative", className)}>
      <Image
        src={networkInfo.imageSrc}
        alt={`Built on ${networkInfo.displayName}`}
        width={80}
        height={80}
      />
    </div>
  );
}
