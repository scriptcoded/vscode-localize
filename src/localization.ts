import { workspace, window } from "vscode";
import { readdir } from "fs";
import { join as joinPath } from "path";

export function loadLocalizations (callback?: Function) {
  console.log('Loading localizations...');
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length <= 0) {
    return;
  }

  const configLocalesFolder: string | undefined = config.get('localesDirectory');

  if (configLocalesFolder === undefined) {
    window.showWarningMessage('No locales folder found.');
    return;
  }

  let primaryFolder = workspace.workspaceFolders[0];
  let localesFolder = joinPath(primaryFolder.uri.fsPath, configLocalesFolder);

  readdir(localesFolder, (err, files) => {
    if (err) {
      throw err;
    }

    loadedLocales = files.map(file => file.replace(/.json$/, ''));

    let localePath = path.join(localesFolder, `${currentLocale}.json`);

    for (let key in decorators) {
      decorators[key].active.dispose();
      decorators[key].inactive.dispose();
    }

    decorators = {};

    vscode.workspace.openTextDocument(localePath).then((document) => {
      let text = document.getText();
      let localizations = JSON.parse(text);

      translations = localizations;
      codeLensProvider.setTranslations(translations);

      for (let key in translations) {
        const active = vscode.window.createTextEditorDecorationType({
          after: {
            contentText: ` ${translations[key]}`,
            color: '#6699cc'
          },
          opacity: '0.35',
          overviewRulerColor: 'blue',
          overviewRulerLane: vscode.OverviewRulerLane.Right
        });
        const inactive = vscode.window.createTextEditorDecorationType({
          after: {
            contentText: translations[key],
            color: '#6699cc'
          },
          opacity: '0',
          letterSpacing: '-1em',
          overviewRulerColor: 'blue',
          overviewRulerLane: vscode.OverviewRulerLane.Right
        });
    
        decorators[key] = {
          active,
          inactive
        };
      }

      if (callback) {
        callback();
      }
    });
  });
}