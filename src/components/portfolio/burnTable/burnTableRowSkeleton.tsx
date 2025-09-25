import React from "react";

export default function BurnTableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      {/* Token */}
      <td className="py-2">
        <div className="h-4 w-16 rounded bg-foreground/10"></div>
      </td>

      {/* Break-even / Price Increase */}
      <td className="hidden py-2 md:table-cell">
        <div className="h-4 w-20 rounded bg-foreground/10"></div>
      </td>

      {/* Vault */}
      <td className="py-2">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 rounded-full bg-foreground/10"></div>
          <div className="h-4 w-24 rounded bg-foreground/10"></div>
        </div>
      </td>

      {/* Value */}
      <td className="py-2">
        <div className="h-4 w-20 rounded bg-foreground/10"></div>
      </td>

      {/* PnL */}
      <td className="py-2">
        <div className="h-4 w-16 rounded bg-foreground/10"></div>
      </td>

      {/* Actions */}
      <td className="py-2 text-center">
        <div className="inline-flex space-x-1">
          <div className="h-7 w-14 rounded bg-foreground/10"></div>
          <div className="h-7 w-7 rounded bg-foreground/10"></div>
        </div>
      </td>
    </tr>
  );
}
