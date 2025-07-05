import { env } from "@/env";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import React from "react";

const chainId = parseInt(env.NEXT_PUBLIC_CHAIN_ID);

export default function ExplorerLink({
  transactionHash,
  align = "center",
}: {
  transactionHash: string | undefined;
  align?: "center" | "left";
}) {
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
            href={`https://${chainId === 1 ? "" : "sepolia."}etherscan.io/tx/${transactionHash}`}
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
