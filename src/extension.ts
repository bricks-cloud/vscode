import * as vscode from 'vscode';
import { FileExplorer } from './fileExplorer';
import { GeneratedCodePreviewPanel } from './generatedCodePreviewPanel';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('bricksDesignToCode.openWebview', () => {
			GeneratedCodePreviewPanel.createOrShow(context.extensionUri);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(GeneratedCodePreviewPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				GeneratedCodePreviewPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}

	new FileExplorer(context);
}


function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'out')]
	};
}