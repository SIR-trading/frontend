import { ChevronRight, ChevronLeft } from "lucide-react";
export default function Pagination({
  max,
  nextPage,
  page,
  prevPage,
  length,
  size = "sm",
}: {
  max: number;
  page: number;
  nextPage: () => void;
  prevPage: () => void;
  length: number;
  size?: "sm" | "lg";
}) {
  if (max < 1) {
    max = 10;
  }
  // Disable next button when current page has less items than max (indicates last page)
  const isLastPage = length < max;

  return (
    <div className="flex items-center justify-center gap-x-3 pt-4">
      <div className="flex items-center gap-x-3">
        <div>
          <button
            disabled={page === 1}
            aria-label="Left"
            onClick={prevPage}
            className="rounded-full bg-gold/10 p-[5px] disabled:opacity-50 dark:bg-primary"
          >
            <ChevronLeft size={size === "sm" ? 17 : 24} />
          </button>
        </div>
        <div
          className={`${size === "sm" ? "h-[25px]" : "h-[30px]"} dark:bg-primary" flex items-center rounded-lg bg-gold/10 px-3 text-[15px]`}
        >
          {page}
        </div>
        <div>
          <button
            role="link"
            aria-label="Scroll Vaults Right"
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
