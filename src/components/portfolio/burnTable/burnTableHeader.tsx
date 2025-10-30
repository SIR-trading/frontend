export default function BurnTableHeaders({ isApe }: { isApe?: boolean }) {
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
            className="hidden xs:table-cell border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
          >
            % PnL
          </th>
          <th
            colSpan={3}
            className="hidden pb-1 pr-4 text-center font-normal xl:table-cell"
            style={{ minWidth: "130px" }}
          >
            <div className="text-sm font-normal">
              Required Price Gain
              <sup className="ml-0.5 text-[10px] text-muted-foreground">*</sup>
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
          className="hidden md:table-cell border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
        >
          PnL
        </th>
        <th
          rowSpan={2}
          className="hidden xs:table-cell border-b border-foreground/15 pb-1 pr-4 text-center align-bottom font-normal"
        >
          % PnL
        </th>
        <th
          colSpan={3}
          className="hidden xl:table-cell pb-1 pr-4 text-center font-normal"
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
