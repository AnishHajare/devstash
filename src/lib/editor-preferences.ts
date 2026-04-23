import { z } from "zod";

export const FONT_SIZE_OPTIONS = [12, 14, 16, 18] as const;
export const TAB_SIZE_OPTIONS = [2, 4] as const;
export const EDITOR_THEME_VALUES = [
  "vs-dark",
  "monokai",
  "github-dark",
] as const;
export const EDITOR_THEME_OPTIONS = [
  { value: "vs-dark", label: "VS Dark" },
  { value: "monokai", label: "Monokai" },
  { value: "github-dark", label: "GitHub Dark" },
] as const;

export type EditorFontSize = (typeof FONT_SIZE_OPTIONS)[number];
export type EditorTabSize = (typeof TAB_SIZE_OPTIONS)[number];
export type EditorTheme = (typeof EDITOR_THEME_OPTIONS)[number]["value"];

export type EditorPreferences = {
  fontSize: EditorFontSize;
  tabSize: EditorTabSize;
  wordWrap: boolean;
  minimap: boolean;
  theme: EditorTheme;
};

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

export const editorFontSizeSchema = z.coerce
  .number({ error: "Invalid font size" })
  .refine(
    (value): value is EditorFontSize =>
      FONT_SIZE_OPTIONS.includes(value as EditorFontSize),
    { message: "Invalid font size" }
  );

export const editorTabSizeSchema = z.coerce
  .number({ error: "Invalid tab size" })
  .refine(
    (value): value is EditorTabSize =>
      TAB_SIZE_OPTIONS.includes(value as EditorTabSize),
    { message: "Invalid tab size" }
  );

export const editorThemeSchema = z.enum(EDITOR_THEME_VALUES, {
  error: "Invalid theme",
});

export const editorPreferencesSchema = z.object({
  fontSize: editorFontSizeSchema,
  tabSize: editorTabSizeSchema,
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: editorThemeSchema,
});

export const EDITOR_THEME_CHROME: Record<
  EditorTheme,
  { editorBg: string; headerBg: string; headerBorder: string }
> = {
  "vs-dark": {
    editorBg: "#1e1e1e",
    headerBg: "#252526",
    headerBorder: "#3e3e42",
  },
  monokai: {
    editorBg: "#272822",
    headerBg: "#1f201c",
    headerBorder: "#3b3d32",
  },
  "github-dark": {
    editorBg: "#0d1117",
    headerBg: "#161b22",
    headerBorder: "#30363d",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeEditorPreferences(value: unknown): EditorPreferences {
  const raw = isRecord(value) ? value : {};

  const fontSize = editorFontSizeSchema.safeParse(raw.fontSize);
  const tabSize = editorTabSizeSchema.safeParse(raw.tabSize);
  const wordWrap = z.boolean().safeParse(raw.wordWrap);
  const minimap = z.boolean().safeParse(raw.minimap);
  const theme = editorThemeSchema.safeParse(raw.theme);

  return {
    fontSize: fontSize.success
      ? fontSize.data
      : DEFAULT_EDITOR_PREFERENCES.fontSize,
    tabSize: tabSize.success ? tabSize.data : DEFAULT_EDITOR_PREFERENCES.tabSize,
    wordWrap: wordWrap.success
      ? wordWrap.data
      : DEFAULT_EDITOR_PREFERENCES.wordWrap,
    minimap: minimap.success ? minimap.data : DEFAULT_EDITOR_PREFERENCES.minimap,
    theme: theme.success ? theme.data : DEFAULT_EDITOR_PREFERENCES.theme,
  };
}

export function buildMonacoEditorOptions(
  preferences: EditorPreferences,
  readOnly: boolean
) {
  return {
    readOnly,
    minimap: { enabled: preferences.minimap },
    fontSize: preferences.fontSize,
    tabSize: preferences.tabSize,
    lineHeight: 20,
    fontFamily:
      'var(--font-geist-mono), "JetBrains Mono", ui-monospace, monospace',
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: "none" as const,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    scrollBeyondLastLine: false,
    wordWrap: preferences.wordWrap ? ("on" as const) : ("off" as const),
    automaticLayout: true,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
      useShadows: false,
    },
    ...(readOnly
      ? { cursorStyle: "line" as const, cursorBlinking: "solid" as const }
      : {}),
  };
}
