"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MonitorCog } from "lucide-react";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import { useEditorPreferences } from "@/components/editor/editor-preferences-provider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  EDITOR_THEME_OPTIONS,
  FONT_SIZE_OPTIONS,
  TAB_SIZE_OPTIONS,
  editorFontSizeSchema,
  editorTabSizeSchema,
  editorThemeSchema,
  type EditorPreferences,
} from "@/lib/editor-preferences";

type SaveState = "idle" | "saving" | "saved" | "error";
const SAVE_DEBOUNCE_MS = 400;

export function EditorPreferencesSection() {
  const { preferences, setPreferences } = useEditorPreferences();
  const [draft, setDraft] = useState(preferences);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const latestRequestRef = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  async function persist(nextPreferences: EditorPreferences) {
    const requestId = ++latestRequestRef.current;
    const result = await updateEditorPreferences(nextPreferences);

    if (requestId !== latestRequestRef.current) {
      return;
    }

    if (!result.success) {
      setSaveState("error");
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setPreferences(result.data);
    setSaveState("saved");
    toast.success("Editor preferences saved");
  }

  function schedulePersist(nextPreferences: EditorPreferences) {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveState("saving");
    setError("");
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      void persist(nextPreferences);
    }, SAVE_DEBOUNCE_MS);
  }

  function updateField<Key extends keyof EditorPreferences>(
    field: Key,
    value: EditorPreferences[Key]
  ) {
    const nextPreferences = { ...draft, [field]: value };
    setDraft(nextPreferences);
    schedulePersist(nextPreferences);
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <MonitorCog className="h-4 w-4 text-muted-foreground" />
          Editor Preferences
        </p>
        <p className="text-sm text-muted-foreground">
          Changes save automatically and apply to Monaco editors across the app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="editor-font-size">Font Size</Label>
          <select
            id="editor-font-size"
            value={draft.fontSize}
            onChange={(e) => {
              const parsed = editorFontSizeSchema.safeParse(e.target.value);
              if (!parsed.success) return;
              updateField("fontSize", parsed.data);
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {FONT_SIZE_OPTIONS.map((fontSize) => (
              <option key={fontSize} value={fontSize}>
                {fontSize}px
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-tab-size">Tab Size</Label>
          <select
            id="editor-tab-size"
            value={draft.tabSize}
            onChange={(e) => {
              const parsed = editorTabSizeSchema.safeParse(e.target.value);
              if (!parsed.success) return;
              updateField("tabSize", parsed.data);
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {TAB_SIZE_OPTIONS.map((tabSize) => (
              <option key={tabSize} value={tabSize}>
                {tabSize} spaces
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-theme">Theme</Label>
          <select
            id="editor-theme"
            value={draft.theme}
            onChange={(e) => {
              const parsed = editorThemeSchema.safeParse(e.target.value);
              if (!parsed.success) return;
              updateField("theme", parsed.data);
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {EDITOR_THEME_OPTIONS.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            checked={draft.wordWrap}
            onChange={(e) => updateField("wordWrap", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Word Wrap</p>
            <p className="text-xs text-muted-foreground">
              Wrap long lines instead of scrolling horizontally.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            checked={draft.minimap}
            onChange={(e) => updateField("minimap", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Minimap</p>
            <p className="text-xs text-muted-foreground">
              Show the right-side code overview inside Monaco.
            </p>
          </div>
        </label>
      </div>

      <div
        className={cn(
          "rounded-lg border px-3 py-2 text-xs",
          saveState === "error"
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border bg-muted/30 text-muted-foreground"
        )}
      >
        {saveState === "saving" && "Saving changes..."}
        {saveState === "saved" && "Saved automatically."}
        {saveState === "error" && error}
        {saveState === "idle" && "Defaults apply automatically for users with no saved preferences yet."}
      </div>
    </div>
  );
}
