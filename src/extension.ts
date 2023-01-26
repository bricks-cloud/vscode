import * as vscode from 'vscode';
import { FileExplorer } from './fileExplorer';
import { UriHandler } from "./UriHandler";

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

	// Uri handling
	let disposable = vscode.commands.registerCommand(
		"bricksDesignToCode.handleUri",
		async () => {
			const uriHandler = new UriHandler();

			context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

			const uri = await vscode.env.asExternalUri(
				vscode.Uri.parse(`${vscode.env.uriScheme}://bricks.d2c-vscode`)
			);

			console.log(
				`Starting to handle Uris. Open ${uri} in your browser to test.`
			);
		}
	);

	context.subscriptions.push(disposable);

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
