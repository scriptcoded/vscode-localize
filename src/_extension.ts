import * as vscode from 'vscode';

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	console.log('decorator sample is activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate small numbers
	const inactiveTranslationDecorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: 'Stäng fönster',
			color: '#6699cc'
		},
		opacity: '0',
		letterSpacing: '-1em',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	const activeTranslationDecorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: ':Stäng fönster',
			color: '#6699cc'
		},
		opacity: '0.35',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right
	});

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /\$t\('([^']+)'\)/g;
		const text = activeEditor.document.getText();
		const inactiveTranslations: vscode.DecorationOptions[] = [];
		const activeTranslations: vscode.DecorationOptions[] = [];

		let offset = activeEditor.document.offsetAt(activeEditor.selection.active);
		
		console.log('Offset:', offset)

		let match;
		while (match = regEx.exec(text)) {
			let index = match[0].indexOf(match[1]) + match.index;

			const startPos = activeEditor.document.positionAt(index);
			const endPos = activeEditor.document.positionAt(index + match[1].length);
			const decoration = {
				range: new vscode.Range(startPos, endPos),
				hoverMessage: 'Number **' + match[0] + '**'
			};
			const cursorInside = offset >= index && offset <= (index + match[1].length)

			if (cursorInside) {
				activeTranslations.push(decoration);
			} else {
				inactiveTranslations.push(decoration);
			}
		}
		activeEditor.setDecorations(inactiveTranslationDecorationType, inactiveTranslations);
		activeEditor.setDecorations(activeTranslationDecorationType, activeTranslations);
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