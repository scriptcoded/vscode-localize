import * as vscode from 'vscode';

interface TranslationMap {
	[key:string]: string;
}
interface DecorationMap {
	[key:string]: {
		active: vscode.TextEditorDecorationType,
		inactive: vscode.TextEditorDecorationType
	};
}
interface TranslationDecorator {
	[key:string]: any;
}
interface TranslationDecoratorMap {
	[key:string]: any[];
}

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	const translations: TranslationMap = {
		'g8ck3s': 'Hello, world!',
		'v90j12': 'Close',
		'k0j2fg': 'dispatch'
	};

	console.log('decorator sample is activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	let decorators: DecorationMap = {};

	for (let key in translations) {
		const active = vscode.window.createTextEditorDecorationType({
			after: {
				contentText: translations[key],
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

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /\$t\('([^']+)'\)/g;
		const text = activeEditor.document.getText();

		const translationDecorations: TranslationDecoratorMap = {};

		let offset = activeEditor.document.offsetAt(activeEditor.selection.active);

		let match;
		while (match = regEx.exec(text)) {
			if (!translations[match[1]]) {
				continue;
			}

			let index = match[0].indexOf(match[1]) + match.index;

			const startPos = activeEditor.document.positionAt(index);
			const endPos = activeEditor.document.positionAt(index + match[1].length);
			const cursorInside = offset >= index && offset <= (index + match[1].length)
			
			const decoration = {
				range: new vscode.Range(startPos, endPos),
				hoverMessage: 'Number **' + match[0] + '**',
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
			activeEditor.setDecorations(decorators[key].active, decorations);
		}

		for (let key of disposeKeys) {
			decorators[key].active.dispose();
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

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.window.onDidChangeTextEditorSelection(editor => {
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

}