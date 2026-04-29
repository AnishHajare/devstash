"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MonitorCog } from "lucide-react";
import { updateEditorPreferences } from "@/actions/editor-preferences";
import { useEditorPreferences } from "@/components/editor/editor-preferences-provider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <Select
            id="editor-font-size"
            value={draft.fontSize}
            onValueChange={(value) => {
              const parsed = editorFontSizeSchema.safeParse(value);
              if (!parsed.success) return;
              updateField("fontSize", parsed.data);
            }}
          >
            <SelectTrigger>
              <SelectValue>{(value) => `${value}px`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map((fontSize) => (
                <SelectItem key={fontSize} value={fontSize}>
                  {fontSize}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-tab-size">Tab Size</Label>
          <Select
            id="editor-tab-size"
            value={draft.tabSize}
            onValueChange={(value) => {
              const parsed = editorTabSizeSchema.safeParse(value);
              if (!parsed.success) return;
              updateField("tabSize", parsed.data);
            }}
          >
            <SelectTrigger>
              <SelectValue>{(value) => `${value} spaces`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TAB_SIZE_OPTIONS.map((tabSize) => (
                <SelectItem key={tabSize} value={tabSize}>
                  {tabSize} spaces
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="editor-theme">Theme</Label>
          <Select
            id="editor-theme"
            value={draft.theme}
            onValueChange={(value) => {
              const parsed = editorThemeSchema.safeParse(value);
              if (!parsed.success) return;
              updateField("theme", parsed.data);
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {(value) =>
                  EDITOR_THEME_OPTIONS.find((theme) => theme.value === value)?.label ??
                  "Choose theme"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EDITOR_THEME_OPTIONS.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  {theme.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-lg border border-border p-3">
          <Checkbox
            checked={draft.wordWrap}
            onCheckedChange={(checked) => updateField("wordWrap", checked)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Word Wrap</p>
            <p className="text-xs text-muted-foreground">
              Wrap long lines instead of scrolling horizontally.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-border p-3">
          <Checkbox
            checked={draft.minimap}
            onCheckedChange={(checked) => updateField("minimap", checked)}
            className="mt-0.5"
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
