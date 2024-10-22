import PorfolioSkeleton from "@/components/portfolio/porfolioSkeleton";
import React from "react";

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center text-white">
      <PorfolioSkeleton />
    </main>
  );
}
