import React from "react";

export default function VaultRowSkeleton() {
  return (
    <tr className="cursor-pointer border-b border-foreground/5 text-left text-sm font-normal transition-colors hover:bg-primary/20 dark:hover:bg-primary">
      <td className="py-2 pl-3 pr-4">
        <Skeleton width="14px" />
      </td>
      <td className="py-2 pr-4">
        <Skeleton width="80px" />
      </td>
      <td className="py-2 pr-4">
        <Skeleton width="28px" />
      </td>
      <td className="hidden py-2 pr-4 text-[13px] font-normal min-[375px]:table-cell">
        <Skeleton width="45px" />
      </td>
      <td className="hidden py-2 pr-4 xl:table-cell">
        <Skeleton width="64px" />
      </td>
      <td className="py-2 text-right">
        <Skeleton width="45px" />
      </td>
    </tr>
  );
}

function Skeleton({ width }: { width: string }) {
  return (
    <div
      style={{ width }}
      className="my-1 h-4  animate-pulse rounded-full bg-foreground/10"
    ></div>
  );
}
