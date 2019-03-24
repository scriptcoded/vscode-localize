import { TextEditorDecorationType } from "vscode";

export interface TranslationMap {
	[key:string]: string;
}
export interface DecorationMap {
	[key:string]: {
		active: TextEditorDecorationType,
		inactive: TextEditorDecorationType
	};
}
export interface TranslationDecoratorMap {
	[key:string]: any[];
}