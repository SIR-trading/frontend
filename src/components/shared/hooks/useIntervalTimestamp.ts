import { useEffect, useState } from "react";

/**
 * useNowTimestamp
 * Returns the current timestamp (in seconds) and updates every 30 seconds.
 */
export function useIntervalTimestamp(): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return now;
}
