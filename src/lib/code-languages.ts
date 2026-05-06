/**
 * Curated list of languages exposed in the code-snippet language picker.
 * `id` matches a Monaco language id so syntax highlighting works out of the box.
 */
export type CodeLanguage = {
  id: string;
  label: string;
};

export const PLAINTEXT_LANGUAGE_ID = "plaintext";

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: PLAINTEXT_LANGUAGE_ID, label: "Plain text" },
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "csharp", label: "C#" },
  { id: "ruby", label: "Ruby" },
  { id: "php", label: "PHP" },
  { id: "swift", label: "Swift" },
  { id: "kotlin", label: "Kotlin" },
  { id: "scala", label: "Scala" },
  { id: "dart", label: "Dart" },
  { id: "shell", label: "Shell / Bash" },
  { id: "powershell", label: "PowerShell" },
  { id: "sql", label: "SQL" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "scss", label: "SCSS" },
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML" },
  { id: "xml", label: "XML" },
  { id: "markdown", label: "Markdown" },
  { id: "dockerfile", label: "Dockerfile" },
  { id: "graphql", label: "GraphQL" },
  { id: "lua", label: "Lua" },
  { id: "r", label: "R" },
  { id: "perl", label: "Perl" },
];

export function getLanguageLabel(id: string | null | undefined): string {
  if (!id) return "Plain text";
  return CODE_LANGUAGES.find((lang) => lang.id === id)?.label ?? id;
}
