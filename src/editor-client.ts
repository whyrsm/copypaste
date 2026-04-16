/// <reference lib="dom" />

import { cpp as langCpp } from "@codemirror/lang-cpp";
import { css as langCss } from "@codemirror/lang-css";
import { go as langGo } from "@codemirror/lang-go";
import { html as langHtml } from "@codemirror/lang-html";
import { java as langJava } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json as langJson } from "@codemirror/lang-json";
import { markdown as langMarkdown } from "@codemirror/lang-markdown";
import { python as langPython } from "@codemirror/lang-python";
import { rust as langRust } from "@codemirror/lang-rust";
import { sql as langSql } from "@codemirror/lang-sql";
import { xml as langXml } from "@codemirror/lang-xml";
import { yaml as langYaml } from "@codemirror/lang-yaml";
import { StreamLanguage } from "@codemirror/language";
import { shell as shellMode } from "@codemirror/legacy-modes/mode/shell";
import { Compartment, EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { basicSetup, EditorView } from "codemirror";

type LanguageName = keyof typeof langFor;

interface EditorMountOptions {
  mountEl: HTMLElement;
  initialContent?: string;
  initialLanguage?: string;
  readOnly?: boolean;
  hiddenInput?: HTMLInputElement | null;
  fullscreenWrapper?: HTMLElement | null;
  fullscreenButton?: HTMLElement | null;
  languageSelect?: HTMLSelectElement | null;
}

const langFor = {
  plaintext: () => [],
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  html: () => langHtml(),
  css: () => langCss(),
  json: () => langJson(),
  markdown: () => langMarkdown(),
  python: () => langPython(),
  go: () => langGo(),
  rust: () => langRust(),
  java: () => langJava(),
  sql: () => langSql(),
  yaml: () => langYaml(),
  xml: () => langXml(),
  shell: () => StreamLanguage.define(shellMode),
  cpp: () => langCpp(),
};

function resolveLang(name: string) {
  const fn = langFor[name as LanguageName] || langFor.plaintext;
  return fn();
}

function currentTheme() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr) return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function themeExtension(theme: string) {
  return theme === "dark" ? oneDark : [];
}

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    fontFamily: "var(--mono)",
    backgroundColor: "var(--surface)",
    color: "var(--text)",
  },
  ".cm-scroller": {
    fontFamily: "var(--mono)",
    lineHeight: "1.55",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "var(--surface-alt)",
    color: "var(--text-3)",
    border: "none",
  },
  ".cm-content": { padding: "12px 0" },
});

function mount(options: EditorMountOptions) {
  const {
    mountEl,
    initialContent = "",
    initialLanguage = "plaintext",
    readOnly = false,
    hiddenInput = null,
    fullscreenWrapper = null,
    fullscreenButton = null,
    languageSelect = null,
  } = options;

  const langCompartment = new Compartment();
  const themeCompartment = new Compartment();
  const readOnlyCompartment = new Compartment();

  const extensions = [
    basicSetup,
    EditorView.lineWrapping,
    editorTheme,
    langCompartment.of(resolveLang(initialLanguage)),
    themeCompartment.of(themeExtension(currentTheme())),
    readOnlyCompartment.of([
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
    ]),
  ];

  if (hiddenInput) {
    extensions.push(
      EditorView.updateListener.of((v) => {
        if (v.docChanged) hiddenInput.value = v.state.doc.toString();
      }),
    );
  }

  const view = new EditorView({
    doc: initialContent,
    extensions,
    parent: mountEl,
  });

  if (hiddenInput) hiddenInput.value = initialContent;

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      view.dispatch({
        effects: langCompartment.reconfigure(resolveLang(languageSelect.value)),
      });
    });
  }

  const themeObserver = new MutationObserver(() => {
    view.dispatch({
      effects: themeCompartment.reconfigure(themeExtension(currentTheme())),
    });
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  if (fullscreenWrapper && fullscreenButton) {
    const toggle = () => {
      const active = fullscreenWrapper.classList.toggle("editor-fullscreen");
      document.body.classList.toggle("editor-fullscreen-open", active);
      fullscreenButton.setAttribute("aria-pressed", String(active));
      const max = fullscreenButton.querySelector<HTMLElement>(".icon-max");
      const min = fullscreenButton.querySelector<HTMLElement>(".icon-min");
      if (max && min) {
        max.style.display = active ? "none" : "";
        min.style.display = active ? "" : "none";
      }
      setTimeout(() => view.requestMeasure(), 0);
    };
    fullscreenButton.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        fullscreenWrapper.classList.contains("editor-fullscreen")
      ) {
        toggle();
      }
    });
  }

  return view;
}

declare global {
  interface Window {
    CopyPasteEditor: { mount: typeof mount };
  }
}
window.CopyPasteEditor = { mount };
