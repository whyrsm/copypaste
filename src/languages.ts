export const LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "html",
  "css",
  "json",
  "markdown",
  "python",
  "go",
  "rust",
  "java",
  "sql",
  "yaml",
  "xml",
  "shell",
  "cpp",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  plaintext: "Plain text",
  javascript: "JavaScript",
  typescript: "TypeScript",
  jsx: "JSX",
  tsx: "TSX",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  markdown: "Markdown",
  python: "Python",
  go: "Go",
  rust: "Rust",
  java: "Java",
  sql: "SQL",
  yaml: "YAML",
  xml: "XML",
  shell: "Shell",
  cpp: "C/C++",
};

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}
