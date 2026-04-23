"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  DEFAULT_EDITOR_PREFERENCES,
  normalizeEditorPreferences,
  type EditorPreferences,
} from "@/lib/editor-preferences";

type EditorPreferencesContextValue = {
  preferences: EditorPreferences;
  setPreferences: Dispatch<SetStateAction<EditorPreferences>>;
};

const EditorPreferencesContext =
  createContext<EditorPreferencesContextValue | null>(null);

export function EditorPreferencesProvider({
  children,
  initialPreferences,
}: {
  children: React.ReactNode;
  initialPreferences: EditorPreferences;
}) {
  const [preferences, setPreferences] = useState(
    normalizeEditorPreferences(initialPreferences)
  );

  return (
    <EditorPreferencesContext.Provider value={{ preferences, setPreferences }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  const context = useContext(EditorPreferencesContext);

  if (!context) {
    return {
      preferences: DEFAULT_EDITOR_PREFERENCES,
      setPreferences: (() => undefined) as Dispatch<SetStateAction<EditorPreferences>>,
    };
  }

  return context;
}
