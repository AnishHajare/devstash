import { cn } from "@/lib/utils";

type DevstashLogoProps = {
  /** "mark" renders only the ds glyph; "lockup" adds the wordmark beside it. */
  variant?: "mark" | "lockup";
  /** Visual size of the mark in pixels. Wordmark scales relative to this. */
  size?: number;
  className?: string;
  /** Accessible label. Defaults to "DevStash". */
  label?: string;
};

export function DevstashLogo({
  variant = "lockup",
  size = 36,
  className,
  label = "DevStash",
}: DevstashLogoProps) {
  const markFontSize = Math.round(size * 1.55);
  const wordFontSize = Math.round(size * 0.62);

  return (
    <span
      className={cn("inline-flex items-baseline gap-2 leading-none", className)}
      role="img"
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className="leading-[0.7]"
        style={{
          fontFamily: "var(--font-script)",
          fontWeight: 400,
          fontSize: markFontSize,
          letterSpacing: "-0.01em",
        }}
      >
        ds
      </span>
      {variant === "lockup" ? (
        <span
          aria-hidden="true"
          className="font-heading"
          style={{
            fontWeight: 700,
            fontSize: wordFontSize,
            letterSpacing: "-0.025em",
          }}
        >
          devstash
        </span>
      ) : null}
    </span>
  );
}
