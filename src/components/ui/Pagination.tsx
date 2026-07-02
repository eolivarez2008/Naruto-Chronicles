"use client";

import { useEffect } from "react";
import {
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

function buildPages(
  page: number,
  totalPages: number,
  compact: boolean,
): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (compact) {
    if (page <= 3) {
      pages.push(2, 3, "...", totalPages);
    } else if (page >= totalPages - 2) {
      pages.push("...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push("...", page, "...", totalPages);
    }
    return pages;
  }

  if (page <= 4) {
    pages.push(2, 3, 4, 5, "...", totalPages);
  } else if (page >= totalPages - 3) {
    pages.push(
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    );
  } else {
    pages.push("...", page - 1, page, page + 1, "...", totalPages);
  }

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  const go = (p: number) => onPageChange(p);

  const isFirst = page === 1;
  const isLast = page === totalPages;

  const btnBase =
    "flex items-center justify-center transition-all duration-150 cursor-pointer font-semibold " +
    "h-8 w-8 text-xs sm:h-9 sm:w-9 sm:text-sm";
  const btnNav =
    "rounded-xl hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed text-white/50";
  const btnPage = "rounded-xl hover:bg-white/10 hover:text-white text-white/50";
  const btnActive =
    "rounded-xl bg-naruto-orange text-white shadow-md shadow-naruto-orange/30 cursor-default";

  return (
    <>
      {/* Mobile */}
      <div className="flex sm:hidden items-center justify-center py-10">
        <div className="flex items-center gap-0.5 bg-white/4 border border-white/8 rounded-2xl px-1.5 py-1.5">
          <button
            onClick={() => go(1)}
            disabled={isFirst}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            onClick={() => go(page - 1)}
            disabled={isFirst}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronLeft size={13} />
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          {buildPages(page, totalPages, true).map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="w-8 h-8 flex items-center justify-center text-white/25 text-xs select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => p !== page && go(p as number)}
                className={`${btnBase} ${p === page ? btnActive : btnPage}`}
              >
                {p}
              </button>
            ),
          )}

          <div className="w-px h-4 bg-white/10 mx-0.5" />

          <button
            onClick={() => go(page + 1)}
            disabled={isLast}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronRight size={13} />
          </button>
          <button
            onClick={() => go(totalPages)}
            disabled={isLast}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center py-10">
        <div className="flex items-center gap-0.5 bg-white/4 border border-white/8 rounded-2xl px-2 py-1.5">
          <button
            onClick={() => go(1)}
            disabled={isFirst}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            onClick={() => go(page - 1)}
            disabled={isFirst}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronLeft size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {buildPages(page, totalPages, false).map((p, i) =>
            p === "..." ? (
              <span
                key={`dots-${i}`}
                className="w-9 h-9 flex items-center justify-center text-white/25 text-sm select-none"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => p !== page && go(p as number)}
                className={`${btnBase} ${p === page ? btnActive : btnPage}`}
              >
                {p}
              </button>
            ),
          )}

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button
            onClick={() => go(page + 1)}
            disabled={isLast}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => go(totalPages)}
            disabled={isLast}
            className={`${btnBase} ${btnNav}`}
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
