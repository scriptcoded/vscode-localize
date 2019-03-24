import { ExtensionContext, window, WorkspaceConfiguration, languages, workspace, OverviewRulerLane, Range, commands } from 'vscode';

import { join as joinPath } from 'path';
import { readdir } from 'fs';

import registerCommands from './registerCommands';

import LocaleCodeLensProvider from './LocaleCodeLensProvider';

import { switchLocale } from './commands';

import {
	TranslationMap,
	DecorationMap,
	TranslationDecoratorMap
} from './interfaces';

export function activate(context: ExtensionContext) {
	console.log('VS Code Localize activated');

	registerCommands(context);
	
	let loadedLocales: string[] = [];
	let currentLocale: string;
	
	let translations: TranslationMap = {};
	let decorators: DecorationMap = {};
	

	let activeEditor = window.activeTextEditor;
	let config: WorkspaceConfiguration;
	
	let timeout: NodeJS.Timer | undefined = undefined;
	
	let docSelector = {
		language: 'javascript',
		scheme: 'file'
	};
	
	let codeLensProvider = new LocaleCodeLensProvider();
	let codeLensProviderDisposable = languages.registerCodeLensProvider(
    docSelector,
    codeLensProvider
  );

  // Push the command and CodeLens provider to the context so it can be disposed of later
  context.subscriptions.push(codeLensProviderDisposable);

	function loadConfiguration () {
		config = workspace.getConfiguration('localize');
		const configDefaultLocale: string | undefined = config.get('defaultLocale');

		if (!configDefaultLocale) {
			return;
		}
		currentLocale = configDefaultLocale;
	}

	function loadLocalizations (callback?: Function) {
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

			let localePath = joinPath(localesFolder, `${currentLocale}.json`);

			for (let key in decorators) {
				decorators[key].active.dispose();
				decorators[key].inactive.dispose();
			}

			decorators = {};

			workspace.openTextDocument(localePath).then((document) => {
				let text = document.getText();
				let localizations = JSON.parse(text);

				translations = localizations;
				codeLensProvider.setTranslations(translations);

				for (let key in translations) {
					const active = window.createTextEditorDecorationType({
						after: {
							contentText: ` ${translations[key]}`,
							color: '#6699cc'
						},
						opacity: '0.35',
						overviewRulerColor: 'blue',
						overviewRulerLane: OverviewRulerLane.Right
					});
					const inactive = window.createTextEditorDecorationType({
						after: {
							contentText: translations[key],
							color: '#6699cc'
						},
						opacity: '0',
						letterSpacing: '-1em',
						overviewRulerColor: 'blue',
						overviewRulerLane: OverviewRulerLane.Right
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

	function updateDecorations(allEditors?: boolean) {
		let editors = [activeEditor];

		if (allEditors) {
			editors = window.visibleTextEditors;
		}

		for (let editor of editors) {
			if (!editor) {
				return;
			}
	
			for (let key in decorators) {
				editor.setDecorations(decorators[key].active, []);
				editor.setDecorations(decorators[key].inactive, []);
			}
	
			const regEx = /\$t\('([^']+)'\)/g;
			const text = editor.document.getText();
	
			const translationDecorations: TranslationDecoratorMap = {};
	
			let offset = editor.document.offsetAt(editor.selection.active);
	
			let match;
			while (match = regEx.exec(text)) {
				if (!translations[match[1]]) {
					continue;
				}
	
				let index = match[0].indexOf(match[1]) + match.index;
	
				const startPos = editor.document.positionAt(index);
				const endPos = editor.document.positionAt(index + match[1].length);
				const cursorInside = offset >= index && offset <= (index + match[1].length);
				
				const decoration = {
					range: new Range(startPos, endPos),
					hoverMessage: `Localization key **${match[1]}**`,
					active: cursorInside
				};
	
				if (!translationDecorations[match[1]]) {
					translationDecorations[match[1]] = [];
				}
	
				translationDecorations[match[1]].push(decoration);
			}
	
			let decorationKeys = Object.keys(decorators);
	
			let disposeKeys = decorationKeys.filter(key => !translationDecorations[key]);
	
			for (let key in translationDecorations) {
				const decorations = translationDecorations[key];
				const active = decorations.filter(decoration => decoration.active);
				const inactive = decorations.filter(decoration => !decoration.active);
				editor.setDecorations(decorators[key].active, active);
				editor.setDecorations(decorators[key].inactive, inactive);
			}
	
			for (let key of disposeKeys) {
				editor.setDecorations(decorators[key].active, []);
				editor.setDecorations(decorators[key].inactive, []);
			}
		}
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		
		timeout = setTimeout(updateDecorations, 50);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}
	
	loadConfiguration();

	window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	window.onDidChangeTextEditorSelection(editor => {
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
	 	}
	}, null, context.subscriptions);

	workspace.onDidChangeWorkspaceFolders(event => {
		loadLocalizations();
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (event.contentChanges.length <= 0 || !workspace.workspaceFolders || workspace.workspaceFolders.length <= 0) {
			return;
		}

		let primaryFolder = workspace.workspaceFolders[0];
		let localesFolder = joinPath(primaryFolder.uri.fsPath, 'lang');

		let inLocalesFolder = event.document.fileName.startsWith(localesFolder);
		if (!inLocalesFolder) {
			return;
		}
		
		loadLocalizations(() => {
			updateDecorations(true);
		});
	}, null, context.subscriptions);

	workspace.onDidChangeConfiguration(event => {
		loadConfiguration();
	}, null, context.subscriptions);

	loadLocalizations();
	
	context.subscriptions.push(commands.registerCommand('localize.switchLocale', async () => {
		let selectedLocale = await switchLocale(loadedLocales);

		if (!selectedLocale) {
			return;
		}

		currentLocale = selectedLocale;

		loadLocalizations(() => {
			updateDecorations(true);
		});
	}));
}