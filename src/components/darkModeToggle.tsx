"use client";
import { Switch } from "@/components/ui/switch";
import useLocalStorage from "use-local-storage";

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useLocalStorage<boolean>(
    "isDark",
    typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  return (
    <div className="mx-auto flex w-fit items-center justify-center rounded-full border-2 border-foreground p-0.5">
      <Switch
        checked={isDark}
        onCheckedChange={() => {
          document.documentElement.classList.toggle("dark", !isDark);
          setIsDark((prev) => !prev);
        }}
        className=""
      />
    </div>
  );
};

export default DarkModeToggle;
