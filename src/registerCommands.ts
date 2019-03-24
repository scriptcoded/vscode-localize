import { commands, ExtensionContext } from "vscode";

import {
	openTranslation,
	switchLocale
} from './commands';

export default function (context: ExtensionContext) {
  let commandDisposable = commands.registerCommand(
    'extension.openTranslation',
    openTranslation
  );
  context.subscriptions.push(commandDisposable);
  
}
