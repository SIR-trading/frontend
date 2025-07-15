import React from "react";

export default function BurnTableRowSkeleton() {
  return (
    <div className="animate-pulse rounded-md border border-foreground/10 bg-background p-4">
      <div className="grid grid-cols-6 gap-4 items-center">
        {/* Token info */}
        <div className="col-span-2 flex items-center space-x-3">
          <div className="w-8 h-8 bg-foreground/10 rounded-full"></div>
          <div className="space-y-1">
            <div className="h-4 w-20 bg-foreground/10 rounded"></div>
            <div className="h-3 w-16 bg-foreground/10 rounded"></div>
          </div>
        </div>
        
        {/* Balance */}
        <div className="flex items-center">
          <div className="h-4 w-16 bg-foreground/10 rounded"></div>
        </div>
        
        {/* Value */}
        <div className="flex items-center">
          <div className="h-4 w-20 bg-foreground/10 rounded"></div>
        </div>
        
        {/* PnL */}
        <div className="flex items-center">
          <div className="h-4 w-16 bg-foreground/10 rounded"></div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end space-x-2">
          <div className="h-8 w-16 bg-foreground/10 rounded"></div>
          <div className="h-8 w-16 bg-foreground/10 rounded"></div>
        </div>
      </div>
    </div>
  );
}
