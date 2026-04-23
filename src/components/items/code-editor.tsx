"use client";

import { useRef, useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";
import { useEditorPreferences } from "@/components/editor/editor-preferences-provider";
import {
  buildMonacoEditorOptions,
  EDITOR_THEME_CHROME,
} from "@/lib/editor-preferences";

type CodeEditorProps = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  accentColor?: string;
};

const DOT_COLORS = ["#ff5f57", "#febc2e", "#28c840"] as const;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 400;

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  accentColor,
}: CodeEditorProps) {
  const { preferences } = useEditorPreferences();
  const themeChrome = EDITOR_THEME_CHROME[preferences.theme];
  const [copied, setCopied] = useState(false);
  const [editorHeight, setEditorHeight] = useState(MIN_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleMount: OnMount = (editor) => {
    // Drive container height from Monaco content height
    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      const clamped = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, contentHeight));
      setEditorHeight(clamped);
      editor.layout();
    };

    updateHeight();
    editor.onDidContentSizeChange(updateHeight);

    // Focus ring in edit mode
    if (!readOnly && accentColor && containerRef.current) {
      const el = containerRef.current;
      editor.onDidFocusEditorWidget(() => {
        el.style.boxShadow = `0 0 0 3px ${accentColor}20`;
        el.style.borderColor = "rgba(255,255,255,0.2)";
      });
      editor.onDidBlurEditorWidget(() => {
        el.style.boxShadow = "none";
        el.style.borderColor = "";
      });
    }
  };

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("monokai", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "75715e" },
        { token: "string", foreground: "e6db74" },
        { token: "number", foreground: "ae81ff" },
        { token: "keyword", foreground: "f92672" },
        { token: "type", foreground: "66d9ef" },
      ],
      colors: {
        "editor.background": "#272822",
        "editor.foreground": "#f8f8f2",
        "editorLineNumber.foreground": "#6f6f68",
        "editorLineNumber.activeForeground": "#f8f8f2",
        "editor.selectionBackground": "#49483e",
      },
    });

    monaco.editor.defineTheme("github-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8b949e" },
        { token: "string", foreground: "a5d6ff" },
        { token: "number", foreground: "79c0ff" },
        { token: "keyword", foreground: "ff7b72" },
        { token: "type", foreground: "ffa657" },
      ],
      colors: {
        "editor.background": "#0d1117",
        "editor.foreground": "#c9d1d9",
        "editorLineNumber.foreground": "#6e7681",
        "editorLineNumber.activeForeground": "#c9d1d9",
        "editor.selectionBackground": "#264f78",
      },
    });
  };

  return (
    <div
      ref={containerRef}
      className="rounded-md border border-border overflow-hidden transition-all duration-150"
      style={{ backgroundColor: themeChrome.editorBg }}
    >
      {/* Header */}
      <div
        className="flex items-center h-8 px-3 border-b"
        style={{
          backgroundColor: themeChrome.headerBg,
          borderColor: themeChrome.headerBorder,
        }}
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

        <span className="flex-1" />

        {/* Language label */}
        {language && (
          <span className="mr-2 text-xs text-muted-foreground uppercase tracking-wide shrink-0">
            {language}
          </span>
        )}

        {/* Copy button */}
        <button
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

      {/* Editor area — explicit pixel height driven by content, clamped to MAX_HEIGHT */}
      <div style={{ height: editorHeight }}>
        <Editor
          value={value}
          language={language || "plaintext"}
          theme={preferences.theme}
          height={editorHeight}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(val) => onChange?.(val ?? "")}
          options={buildMonacoEditorOptions(preferences, readOnly)}
        />
      </div>
    </div>
  );
}
