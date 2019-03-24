import {
  CodeLensProvider,
  TextDocument,
  CodeLens,
  Range,
  Command,
  window
} from "vscode";

import { TranslationMap } from "./interfaces";

class LocaleCodeLensProvider implements CodeLensProvider {
  private translations: TranslationMap = {};

  setTranslations (translations: TranslationMap) {
    this.translations = translations;
  }

  // Each provider requires a provideCodeLenses function which will give the various documents
  // the code lenses
  async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    let activeEditor = window.activeTextEditor;
    
    if (!activeEditor) {
      return [];
    }

    const regEx = /\$t\('([^']+)'\)/g;
		const text = activeEditor.document.getText();

    let lenses: CodeLens[] = [];
    
		let match;
		while (match = regEx.exec(text)) {
			if (!this.translations[match[1]]) {
				continue;
			}

			let index = match[0].indexOf(match[1]) + match.index;

			const startPos = activeEditor.document.positionAt(index);
			const endPos = activeEditor.document.positionAt(index + match[1].length);

      console.log('Match:', match[1]);
      
      const command: Command = {
        command: "extension.openTranslation",
        arguments: [match[1]],
        title: "Edit translation"
      };
      
			lenses.push(new CodeLens(new Range(startPos, endPos), command));
		}

    return lenses;
  }
}

export default LocaleCodeLensProvider;