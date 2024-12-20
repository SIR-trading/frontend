import { useEffect, useState } from "react";

export const useDebounce = <T>(value: T, milliSeconds: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [debouncing, setDebouncing] = useState(false);
  useEffect(() => {
    setDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setDebouncing(false);
    }, milliSeconds);

    return () => {
      clearTimeout(handler);
      setDebouncing(false);
    };
  }, [value, milliSeconds]);

  return { debouncedValue, debouncing };
};
