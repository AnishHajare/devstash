import { describe, expect, it } from "vitest";
import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_THEME_CHROME,
  buildMonacoEditorOptions,
  editorFontSizeSchema,
  editorTabSizeSchema,
  editorThemeSchema,
  normalizeEditorPreferences,
} from "@/lib/editor-preferences";

describe("normalizeEditorPreferences", () => {
  it("returns defaults for null or missing values", () => {
    expect(normalizeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(normalizeEditorPreferences(undefined)).toEqual(
      DEFAULT_EDITOR_PREFERENCES
    );
  });

  it("keeps valid saved values", () => {
    expect(
      normalizeEditorPreferences({
        fontSize: 16,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "monokai",
      })
    ).toEqual({
      fontSize: 16,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: "monokai",
    });
  });

  it("falls back field by field when saved JSON is partial or invalid", () => {
    expect(
      normalizeEditorPreferences({
        fontSize: 99,
        tabSize: 4,
        wordWrap: "yes",
        minimap: true,
        theme: "unknown",
      })
    ).toEqual({
      fontSize: DEFAULT_EDITOR_PREFERENCES.fontSize,
      tabSize: 4,
      wordWrap: DEFAULT_EDITOR_PREFERENCES.wordWrap,
      minimap: true,
      theme: DEFAULT_EDITOR_PREFERENCES.theme,
    });
  });
});

describe("buildMonacoEditorOptions", () => {
  it("maps preferences into Monaco editor options", () => {
    const options = buildMonacoEditorOptions(
      {
        fontSize: 18,
        tabSize: 4,
        wordWrap: false,
        minimap: true,
        theme: "github-dark",
      },
      false
    );

    expect(options.fontSize).toBe(18);
    expect(options.tabSize).toBe(4);
    expect(options.wordWrap).toBe("off");
    expect(options.minimap).toEqual({ enabled: true });
    expect(options.readOnly).toBe(false);
  });

  it("adds read-only cursor settings when requested", () => {
    const options = buildMonacoEditorOptions(DEFAULT_EDITOR_PREFERENCES, true);

    expect(options.readOnly).toBe(true);
    expect(options.cursorStyle).toBe("line");
    expect(options.cursorBlinking).toBe("solid");
  });
});

describe("editor preference field schemas", () => {
  it("parses valid select values", () => {
    expect(editorFontSizeSchema.parse("16")).toBe(16);
    expect(editorTabSizeSchema.parse("4")).toBe(4);
    expect(editorThemeSchema.parse("monokai")).toBe("monokai");
  });

  it("rejects invalid select values", () => {
    expect(editorFontSizeSchema.safeParse("13").success).toBe(false);
    expect(editorTabSizeSchema.safeParse("3").success).toBe(false);
    expect(editorThemeSchema.safeParse("dracula").success).toBe(false);
  });
});

describe("EDITOR_THEME_CHROME", () => {
  it("exposes chrome colors for every supported theme", () => {
    expect(EDITOR_THEME_CHROME["vs-dark"].editorBg).toBe("#1e1e1e");
    expect(EDITOR_THEME_CHROME.monokai.editorBg).toBe("#272822");
    expect(EDITOR_THEME_CHROME["github-dark"].editorBg).toBe("#0d1117");
  });
});
