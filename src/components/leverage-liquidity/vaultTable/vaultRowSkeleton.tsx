import React from "react";

export default function VaultRowSkeleton() {
  return (
    <tr className="grid cursor-pointer grid-cols-4 rounded-md   px-1 py-1 text-left text-[16px] text-sm font-normal transition-colors hover:bg-primary md:grid-cols-9">
      <th className="-ml-1">
        <Skeleton width="14px" />
      </th>
      <th className="flex items-center md:col-span-3">
        <Skeleton width="80px" />
      </th>
      <th className="hidden items-center md:flex">
        <Skeleton width="28px" />
      </th>
      <th className="hidden items-center gap-x-1 text-[13px] font-normal text-red-400 md:flex">
        <Skeleton width="45px" />
      </th>
      <th className="pl-2">
        <Skeleton width="64px" />
      </th>

      <th className="flex items-center justify-end gap-x-1 text-right md:col-span-2">
        <Skeleton width="45px" />
      </th>
    </tr>
  );
}

function Skeleton({ width }: { width: string }) {
  return (
    <div
      style={{ width }}
      className="my-1 h-4  animate-pulse rounded-full bg-gray-700/70 "
    ></div>
  );
}
