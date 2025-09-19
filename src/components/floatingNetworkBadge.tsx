"use client";
import NetworkBadge from "./networkBadge";
import { useEffect, useState } from "react";

export default function FloatingNetworkBadge() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth > 1580);
    };

    // Check on mount
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isLargeScreen) {
    // For screens wider than 1580px - show floating badge
    return (
      <div className="hidden md:block fixed bottom-4 left-4 z-50">
        <NetworkBadge variant="full" className="shadow-2xl" />
      </div>
    );
  }

  // For screens between 768px and 1580px - badge will be in footer
  // For mobile (<768px) - badge is in the navigation menu
  return null;
}