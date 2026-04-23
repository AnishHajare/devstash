import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1;

          return (
            <PageLink
              key={page}
              href={getHref(page)}
              isCurrent={page === currentPage}
            >
              {page}
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
