import { roundDown } from "@/lib/utils";
export function BalancePercent({
  setValue,
  balance,
  overrideMaxValue,
  disabled,
  settings,
}: {
  overrideMaxValue?: string;
  setValue: (s: string) => void;
  balance: string | undefined;
  disabled?: boolean;
  settings?: React.ReactNode;
}) {
  return (
    <h2 className="flex justify-end gap-x-2 pt-1 text-right font-geist text-sm">
      {settings}
      <button
        onClick={() =>
          setValue(
            roundDown(Number.parseFloat(balance ?? "0") / 4, 4).toString(),
          )
        }
        aria-label="25% Balance"
        type="button"
        disabled={disabled}
        className="hover:underline"
      >
        25%
      </button>{" "}
      <button
        disabled={disabled}
        onClick={() =>
          setValue(
            roundDown(Number.parseFloat(balance ?? "0") / 2, 4).toString(),
          )
        }
        aria-label="50% Balance"
        type="button"
        className="hover:underline"
      >
        50%
      </button>{" "}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!overrideMaxValue) {
            setValue(balance ?? "");
            return;
          }
          if (
            Number.parseFloat(overrideMaxValue) >
            Number.parseFloat(balance ?? "0")
          ) {
            setValue(balance ?? "");
            return;
          }
          setValue(overrideMaxValue);
        }}
        aria-label="Max Balance"
        className="hover:underline"
      >
        Max
      </button>
    </h2>
  );
}
