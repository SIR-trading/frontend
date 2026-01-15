import HoverPopup from "@/components/ui/hover-popup";
import { Info } from "lucide-react";

interface BurnTableHeadersProps {
  isApe?: boolean;
  useSaturationMode?: boolean;
  onSaturationModeChange?: (value: boolean) => void;
}

export default function BurnTableHeaders({
  isApe,
  useSaturationMode,
  onSaturationModeChange,
}: BurnTableHeadersProps) {
  if (isApe === true) {
    return (
      <thead>
        <tr className="text-left text-[14px] font-thin text-muted-foreground">
          <th
            rowSpan={2}
            className="border-b border-foreground/15 pb-1 pr-4 align-bottom font-normal"
          >
            Token
          </th>
          <th
            rowSpan={2}
            className="border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
          >
            Vault
          </th>
          <th
            rowSpan={2}
            className="hidden border-b border-foreground/15 pb-1 pr-4 text-left align-bottom font-normal md:table-cell"
          >
            Price Change
          </th>
          <th
            rowSpan={2}
            className="border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
          >
            Value
          </th>
          <th
            rowSpan={2}
            className="hidden border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal md:table-cell"
          >
            PnL
          </th>
          <th
            rowSpan={2}
            className="hidden border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal xs:table-cell"
          >
            % PnL
          </th>
          <th
            colSpan={3}
            className="hidden pb-1 pr-4 text-center font-normal xl:table-cell"
            style={{ minWidth: "130px" }}
          >
            <div className="text-sm font-normal">
              <div className="flex items-center justify-center gap-1.5">
                <span>Required Price Gain</span>
                <sup className="text-[10px] text-muted-foreground">*</sup>
              </div>
              {onSaturationModeChange && (
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <span
                    onClick={() => onSaturationModeChange(false)}
                    className={`cursor-pointer text-[10px] transition-colors ${
                      !useSaturationMode
                        ? "text-accent-600 dark:text-accent-100"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    Ideal
                  </span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span
                    onClick={() => onSaturationModeChange(true)}
                    className={`cursor-pointer text-[10px] transition-colors ${
                      useSaturationMode
                        ? "text-accent-600 dark:text-accent-100"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    Current
                  </span>
                  <HoverPopup
                    size="250"
                    trigger={
                      <Info className="h-3 w-3 cursor-pointer text-muted-foreground" />
                    }
                  >
                    <div className="space-y-1 text-[12px]">
                      <div>
                        <strong>Ideal:</strong> Unlimited LP liquidity
                      </div>
                      <div>
                        <strong>Current:</strong> Current vault liquidity
                      </div>
                    </div>
                  </HoverPopup>
                </div>
              )}
            </div>
          </th>
          <th
            rowSpan={2}
            className="border-b border-foreground/15 pb-1 text-center align-bottom font-normal"
          >
            Actions
          </th>
        </tr>
        <tr className="border-b border-foreground/15 text-[10px] text-muted-foreground">
          <th className="hidden pb-1 pr-2 text-right font-normal xl:table-cell">
            B/E
          </th>
          <th className="hidden pb-1 pr-2 text-right font-normal xl:table-cell">
            2x
          </th>
          <th className="hidden pb-1 pr-4 text-right font-normal xl:table-cell">
            10x
          </th>
        </tr>
      </thead>
    );
  }

  return (
    <thead>
      <tr className="text-left text-[14px] font-thin text-muted-foreground">
        <th
          rowSpan={2}
          className="border-b border-foreground/15 pb-1 pr-4 align-bottom font-normal"
        >
          Token
        </th>
        <th
          rowSpan={2}
          className="border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
        >
          Vault
        </th>
        <th
          rowSpan={2}
          className="hidden border-b border-foreground/15 pb-1 pr-4 text-left align-bottom font-normal md:table-cell"
        >
          Price Change
        </th>
        <th
          rowSpan={2}
          className="border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
        >
          Value
        </th>
        <th
          rowSpan={2}
          className="hidden border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal md:table-cell"
        >
          PnL
        </th>
        <th
          rowSpan={2}
          className="hidden border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal xs:table-cell"
        >
          % PnL
        </th>
        <th
          colSpan={3}
          className="hidden pb-1 pr-4 text-center font-normal xl:table-cell"
          style={{ minWidth: "130px" }}
        >
          <div className="text-sm font-normal">
            Required Time
            <sup className="ml-0.5 text-[10px] text-muted-foreground">†</sup>
          </div>
        </th>
        <th
          rowSpan={2}
          className="border-b border-foreground/15 pb-1 text-center align-bottom font-normal"
        >
          Actions
        </th>
      </tr>
      <tr className="border-b border-foreground/15 text-[10px] text-muted-foreground">
        <th className="hidden pb-1 pr-2 text-right font-normal xl:table-cell">
          B/E
        </th>
        <th className="hidden pb-1 pr-2 text-right font-normal xl:table-cell">
          2x
        </th>
        <th className="hidden pb-1 pr-4 text-right font-normal xl:table-cell">
          10x
        </th>
      </tr>
    </thead>
  );
}
