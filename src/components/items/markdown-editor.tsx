"use client";

import { useState, useMemo } from "react";
import { marked } from "marked";
import { Copy, Check } from "lucide-react";

marked.setOptions({ gfm: true, breaks: false });

const DOT_COLORS = ["#ff5f57", "#febc2e", "#28c840"] as const;

type MarkdownEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  accentColor?: string;
  placeholder?: string;
};

export function MarkdownEditor({
  value,
  onChange,
  accentColor,
  placeholder = "Write markdown...",
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => marked.parse(value) as string, [value]);

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
export function MarkdownView({ content }: { content: string }) {
  const html = useMemo(() => marked.parse(content) as string, [content]);
  return (
    <div
      className="markdown-preview rounded-md border border-border"
      style={{ backgroundColor: "#1e1e1e" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
