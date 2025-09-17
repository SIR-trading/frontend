import { getExplorerUrl } from "@/lib/chains";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function ExplorerLink({
  transactionHash,
  align = "center",
}: {
  transactionHash: string | undefined;
  align?: "center" | "left";
}) {
  const explorerUrl = getExplorerUrl();

  return (
    <>
      {transactionHash && (
        <div
          data-align={align}
          className="flex gap-x-4 data-[align=center]:justify-center"
        >
          <Link
            className="flex items-center gap-x-1 text-sm text-foreground hover:text-foreground/80"
            target="_blank"
            href={`${explorerUrl}/tx/${transactionHash}`}
          >
            <ExternalLink size={15} />
            <div className="flex items-center gap-x-1">
              <span>View Transaction on Explorer</span>
            </div>
          </Link>
        </div>
      )}
    </>
  );
}
