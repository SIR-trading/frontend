"use client";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useVaultProvider } from "../providers/vaultProvider";
export default function Pagination({ max }: { max: number }) {
  if (max < 1) {
    max = 1;
  }
  // let page = pagination ? parseInt(pagination) : 1;
  const { nextPage, vaultLength, prevPage, page } = useVaultProvider();
  return (
    <div className="flex items-center justify-end gap-x-3 pt-4">
      <div className="flex items-center gap-x-3">
        <div>
          <button
            disabled={page === 1}
            aria-label="Left"
            onClick={prevPage}
            className="rounded-full bg-primary p-[5px] disabled:opacity-50"
          >
            <ChevronLeft size={17} />
          </button>
        </div>
        <div className="flex h-[25px] items-center rounded-lg bg-primary px-3 text-[15px]">
          {page}
        </div>
        <div>
          <button
            role="link"
            aria-label="Scroll Vaults Right"
            disabled={vaultLength !== 10}
            className="rounded-full bg-primary p-[5px] disabled:opacity-50"
            onClick={() => nextPage()}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
