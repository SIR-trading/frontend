"use client";
import React, { useEffect, useState } from "react";

const MonthlyCountdown = () => {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      // Get the first day of next month at 00:00:00 UTC
      const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
      const diff = nextMonth.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Resetting...");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

      setTimeRemaining(parts.join(" "));
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
      <span>Restarts in:</span>
      <span className="font-mono font-medium text-foreground">{timeRemaining || "Calculating..."}</span>
    </div>
  );
};

export default MonthlyCountdown;