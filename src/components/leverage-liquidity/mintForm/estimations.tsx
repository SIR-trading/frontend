import { formatNumber } from "@/lib/utils";

export default function Estimations({
  ape,
  disabled,
  isApe,
}: {
  ape: string;
  isApe: boolean;
  disabled: boolean;
}) {
  return (
    <div className={` pt-2 ${disabled ? "opacity-80" : ""}`}>
      <h2 className="text-sm text-foreground">You receive</h2>
      <div className="pt-1"></div>
      <div className="flex items-center justify-between rounded-md bg-primary/5 p-4 dark:bg-primary">
        <h2
          className={`text-md flex items-center gap-2 text-foreground md:text-3xl`}
        >
          {ape}
          <span className="text-sm text-foreground/80 md:text-xl">
            {" "}
            {isApe ? "APE" : "TEA"}
          </span>
        </h2>
      </div>
    </div>
  );
}
