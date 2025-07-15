import React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function PortfolioSkeleton() {
  return <TableSkeleton rows={3} columns={6} className="w-full" />;
}
