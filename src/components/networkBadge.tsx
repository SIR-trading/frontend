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
        name: "HYPEREVM",
        displayName: "HyperEVM",
        gradient: "from-green-400 via-teal-500 to-blue-500",
        bgColor: "bg-teal-500/10",
        borderColor: "border-teal-500/20",
        textColor: "text-teal-400",
        iconBg: "bg-gradient-to-br from-green-400 to-teal-500",
        imageSrc: "/built_on_hyperevm.jpg",
      };
    }
    return {
      name: "ETHEREUM",
      displayName: "Ethereum",
      gradient: "from-purple-400 via-blue-500 to-indigo-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-400",
      iconBg: "bg-gradient-to-br from-purple-400 to-blue-500",
      imageSrc: "/built_on_ethereum.jpg",
    };
  }, [isHyperEVM]);

  // Render minimal variant (icon only)
  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          networkInfo.iconBg,
          "shadow-lg",
          className,
        )}
      >
        <div
          className="h-4 w-4 rounded bg-white/90"
          style={{
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
          }}
        />
      </div>
    );
  }

  // Render compact variant
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-1.5",
          networkInfo.bgColor,
          "border",
          networkInfo.borderColor,
          "backdrop-blur-sm",
          className,
        )}
      >
        <div className="relative h-2 w-2">
          <div
            className={cn(
              "absolute inset-0 rounded-full",
              networkInfo.iconBg,
              "animate-pulse",
            )}
          />
          <div
            className={cn("absolute inset-0 rounded-full", networkInfo.iconBg)}
          />
        </div>
        <span className={cn("text-xs font-medium", networkInfo.textColor)}>
          {networkInfo.name}
        </span>
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
