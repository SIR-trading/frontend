import { ChevronRight, ChevronLeft } from "lucide-react";

export default function Pagination({
  totalPages,
  page,
  nextPage,
  prevPage,
  size = "sm",
  totalLabel,
}: {
  totalPages: number;
  page: number;
  nextPage: () => void;
  prevPage: () => void;
  size?: "sm" | "lg";
  totalLabel?: string;
}) {
  const isLastPage = page >= totalPages;

  return (
    <div className="flex items-center justify-center gap-x-3 pt-4">
      {totalLabel && (
        <span className="text-sm text-muted-foreground">{totalLabel}</span>
      )}
      <div className="flex items-center gap-x-3">
        <div>
          <button
            disabled={page === 1}
            aria-label="Previous page"
            onClick={prevPage}
            className="rounded-full bg-gold/10 p-[5px] disabled:opacity-50 dark:bg-primary"
          >
            <ChevronLeft size={size === "sm" ? 17 : 24} />
          </button>
        </div>
        <div
          className={`${size === "sm" ? "h-[25px]" : "h-[30px]"} dark:bg-primary" flex items-center rounded-lg bg-gold/10 px-3 text-[15px]`}
        >
          {`${page} / ${totalPages}`}
        </div>
        <div>
          <button
            aria-label="Next page"
            disabled={isLastPage}
            className="rounded-full bg-gold/10 p-[5px] disabled:opacity-50 dark:bg-primary"
            onClick={() => nextPage()}
          >
            <ChevronRight size={size === "sm" ? 17 : 24} />
          </button>
        </div>
      </div>
    </div>
  );
}
