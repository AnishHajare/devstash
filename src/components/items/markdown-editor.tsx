"use client";

import type { ReactNode } from "react";
import { useState, useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

marked.setOptions({ gfm: true, breaks: false });

const DOT_COLORS = ["#ff5f57", "#febc2e", "#28c840"] as const;

type MarkdownEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  accentColor?: string;
  placeholder?: string;
  extraControls?: ReactNode;
};

export function MarkdownEditor({
  value,
  onChange,
  accentColor,
  placeholder = "Write markdown...",
  extraControls,
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => DOMPurify.sanitize(marked.parse(value) as string), [value]);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFocus(el: HTMLTextAreaElement | null) {
    if (!el || !accentColor) return;
    el.style.boxShadow = `0 0 0 3px ${accentColor}20`;
  }

  function handleBlur(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.boxShadow = "none";
  }

  return (
    <div
      className="rounded-md border border-border overflow-hidden transition-all duration-150"
      style={{ backgroundColor: "#1e1e1e" }}
    >
      {/* Header */}
      <div
        className="flex items-center h-8 px-3 border-b"
        style={{ backgroundColor: "#252526", borderColor: "#3e3e42" }}
      >
        {/* macOS dots */}
        <div className="flex items-center gap-1.5 shrink-0">
          {DOT_COLORS.map((color) => (
            <span
              key={color}
              className="rounded-full shrink-0"
              style={{ width: 10, height: 10, backgroundColor: color }}
            />
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 ml-3">
          <button
            type="button"
            onClick={() => setTab("write")}
            className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
              tab === "write"
                ? "text-foreground bg-white/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`px-2.5 py-0.5 text-xs rounded transition-colors ${
              tab === "preview"
                ? "text-foreground bg-white/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preview
          </button>
        </div>

        <span className="flex-1" />

        {extraControls}

        {/* Copy button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-white/10 shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Body */}
      {tab === "preview" ? (
        value ? (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="markdown-preview flex items-start">
            <span className="text-muted-foreground text-sm italic">Nothing to preview.</span>
          </div>
        )
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground px-4 py-3 resize-none focus:outline-none"
          style={{ minHeight: 160, maxHeight: 400 }}
          ref={(el) => {
            if (el) el.style.overflowY = el.scrollHeight > 400 ? "auto" : "hidden";
          }}
          onFocus={(e) => handleFocus(e.currentTarget)}
          onBlur={(e) => handleBlur(e.currentTarget)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 400) + "px";
            el.style.overflowY = el.scrollHeight > 400 ? "auto" : "hidden";
          }}
        />
      )}
    </div>
  );
}

// Lightweight read-only markdown renderer — used in item drawer view mode
export function MarkdownView({
  content,
  className,
  backgroundColor = "#1e1e1e",
  copyValue,
  headerTabs,
  extraControls,
  body,
}: {
  content: string;
  className?: string;
  backgroundColor?: string;
  copyValue?: string;
  headerTabs?: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{
      value: string;
      label: string;
    }>;
  };
  extraControls?: ReactNode;
  body?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => DOMPurify.sanitize(marked.parse(content) as string), [content]);

  async function handleCopy() {
    await navigator.clipboard.writeText(copyValue ?? content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!headerTabs && !extraControls && !body && !copyValue) {
    return (
      <div
        className={cn("markdown-preview rounded-md border border-border", className)}
        style={{ backgroundColor }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={cn("overflow-hidden rounded-md border border-border", className)}
      style={{ backgroundColor }}
    >
      <div
        className="flex items-center h-8 px-3 border-b"
        style={{ backgroundColor: "#252526", borderColor: "#3e3e42" }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {DOT_COLORS.map((color) => (
            <span
              key={color}
              className="rounded-full shrink-0"
              style={{ width: 10, height: 10, backgroundColor: color }}
            />
          ))}
        </div>

        {headerTabs && headerTabs.options.length > 0 && (
          <div className="ml-3 flex items-center gap-0.5">
            {headerTabs.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => headerTabs.onChange(option.value)}
                className={`rounded px-2.5 py-0.5 text-xs transition-colors ${
                  headerTabs.value === option.value
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <span className="flex-1" />

        {extraControls}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-white/10 shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {body ?? (
        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
