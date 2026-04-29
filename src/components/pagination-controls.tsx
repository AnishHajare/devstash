import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const ELLIPSIS = "ellipsis";
type PaginationItem = number | typeof ELLIPSIS;

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 4) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
    pages.add(5);
  }

  if (currentPage >= totalPages - 3) {
    pages.add(totalPages - 4);
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.flatMap((page, index) => {
    const previous = sortedPages[index - 1];
    if (previous && page - previous > 1) {
      return [ELLIPSIS, page];
    }

    return [page];
  });
}

function PageLink({
  href,
  children,
  isCurrent = false,
}: {
  href: string;
  children: ReactNode;
  isCurrent?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors",
        isCurrent
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function BoundaryLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: ReactNode;
}) {
  const className =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-sm font-medium transition-colors";

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={cn(
          className,
          "cursor-not-allowed bg-muted/40 text-muted-foreground/50"
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        className,
        "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function PaginationControls({
  currentPage,
  totalPages,
  getHref,
}: {
  currentPage: number;
  totalPages: number;
  getHref: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
    >
      <BoundaryLink
        href={getHref(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Prev</span>
      </BoundaryLink>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {getPaginationItems(currentPage, totalPages).map((item, index) => {
          if (item === ELLIPSIS) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-8 min-w-8 items-center justify-center px-2 text-sm text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          return (
            <PageLink
              key={item}
              href={getHref(item)}
              isCurrent={item === currentPage}
            >
              {item}
            </PageLink>
          );
        })}
      </div>

      <BoundaryLink
        href={getHref(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </BoundaryLink>
    </nav>
  );
}
