import React from "react";

export default function VaultRowSkeleton() {
  return (
    <tr className="flex items-center justify-between cursor-pointer rounded-md px-1 py-1 text-left text-[16px] text-sm font-normal transition-colors hover:bg-primary/20 dark:hover:bg-primary">
      <td className="flex-shrink-0 w-12 sm:w-14">
        <Skeleton width="14px" />
      </td>
      <td className="flex-shrink-0 w-24 min-[650px]:flex-1 min-[650px]:min-w-0 lg:w-24 lg:flex-shrink-0 min-[1130px]:flex-1 lg:max-w-none min-[650px]:max-w-[200px]">
        <Skeleton width="80px" />
      </td>
      <td className="flex-shrink-0 w-16 sm:w-20 pl-2 sm:pl-3">
        <Skeleton width="28px" />
      </td>
      <td className="hidden text-[13px] font-normal text-foreground/80 min-[450px]:block flex-shrink-0 w-16 pl-2">
        <Skeleton width="45px" />
      </td>
      <td className="relative hidden items-center xl:flex flex-shrink-0 w-20">
        <Skeleton width="64px" />
      </td>
      <td className="flex items-center justify-end gap-x-1 text-right flex-shrink-0 w-20 min-[450px]:w-32 min-[650px]:w-24 md:w-32 lg:w-24">
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
