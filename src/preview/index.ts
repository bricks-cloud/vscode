import * as vscode from "vscode";
import { disposeAll } from "./utils";
import { startWebpackServer, stopWebpackServer } from "./webpackServer";
import { writeEntryFile } from "./writeEntryFile";

let webviewPanel: vscode.WebviewPanel | undefined;
let currentlyOpenedFilePath: string | undefined;
const disposables: vscode.Disposable[] = [];

export async function createOrShow(extensionUri: vscode.Uri) {
  if (
    webviewPanel &&
    currentlyOpenedFilePath ===
      vscode.window.activeTextEditor?.document.uri.path
  ) {
    webviewPanel.reveal(vscode.ViewColumn.Beside);
    return;
  }

  vscode.window.showInformationMessage("Starting preview...");

  writeEntryFile(extensionUri.path);

  // live reload for html
  vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === "html") {
      writeEntryFile(extensionUri.path);
    }
  }, disposables);

  await startWebpackServer(extensionUri.path);

  setupWebviewPanel(extensionUri);

  currentlyOpenedFilePath = vscode.window.activeTextEditor?.document.uri.path;
}

function setupWebviewPanel(extensionUri: vscode.Uri) {
  webviewPanel = vscode.window.createWebviewPanel(
    "localhostBrowserPreview",
    "LocalHost Preview",
    vscode.ViewColumn.Beside,
    {
      // Enable javascript in the webview
      enableScripts: true,
      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    }
  );

  webviewPanel.title = "LocalHost Preview";

  /**
   * Set up HTML that will live inside the webview
   */
  const stylesResetUri = webviewPanel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "reset.css")
  );

  const stylesMainUri = webviewPanel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "vscode.css")
  );

  webviewPanel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${stylesResetUri}" rel="stylesheet">
      <link href="${stylesMainUri}" rel="stylesheet">
      <title>React Component Preview</title>
    </head>
    <body>
      <iframe src="http://localhost:9132/" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
    </body>
    </html>`;

  /**
   * Clean up when the webview panel is closed
   */
  webviewPanel.onDidDispose(
    async () => {
      await stopWebpackServer();
      disposeAll(disposables);
      webviewPanel = undefined;
    },
    null,
    disposables
  );
}
