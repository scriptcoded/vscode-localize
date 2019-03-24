import { Range, window, SnippetString } from "vscode";

async function openTranslation (key: string) {
  console.log('Opening translation:', key);
}

async function switchLocale (locales: string[]) {
  return window.showQuickPick(locales);
}

export {
  openTranslation,
  switchLocale
};