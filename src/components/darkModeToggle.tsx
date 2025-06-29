"use client";
import { Switch } from "@/components/ui/switch";
import useLocalStorage from "use-local-storage";

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useLocalStorage<boolean>(
    "isDark",
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  return (
    <div>
      <Switch
        checked={isDark}
        onCheckedChange={() => {
          document.documentElement.classList.toggle("dark", !isDark);
          setIsDark((prev) => !prev);
        }}
        className="bg-gold/50 dark:bg-gold"
      />
    </div>
  );
};

export default DarkModeToggle;
