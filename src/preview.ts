import * as vscode from "vscode";
import fs from "fs";
import path from "path";
import Webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import createWebpackConfig from "./createWebpackConfig";
import http from "http";

let webviewPanel: vscode.WebviewPanel | undefined;
let server: WebpackDevServer | undefined;
const disposables: vscode.Disposable[] = [];

export async function createOrShow(extensionUri: vscode.Uri) {
  if (webviewPanel) {
    webviewPanel.reveal(vscode.ViewColumn.Beside);
    return;
  }

  if (!shouldOpenPreview()) {
    vscode.window.showInformationMessage(
      "We cannot show a live preview for the file you opened."
    );
    return;
  }

  vscode.window.showInformationMessage("Starting preview...");

  const languageId = vscode.window.activeTextEditor?.document.languageId || "";

  switch (languageId) {
    case "typescriptreact":
    case "javascriptreact":
      createWrapperForCurrentlyOpenedReactFile(extensionUri.path);
      break;
    case "html":
      break;
  }

  await startWebpackServer(extensionUri.path);

  setupWebviewPanel(extensionUri);
}

function shouldOpenPreview(): boolean {
  const languageId = vscode.window.activeTextEditor?.document.languageId || "";

  // Languages supported in live preview by this extension
  const supportedLanguageIds = ["typescriptreact", "javascriptreact", "html"];

  return !!supportedLanguageIds.includes(languageId);
}

function createWrapperForCurrentlyOpenedReactFile(extensionPath: string) {
  const componentPath = vscode.window.activeTextEditor!.document.uri.path;
  const activeFileName = componentPath.split("/").pop() as string;
  const componentName = activeFileName.split(".")[0];

  const code = `import { createRoot } from "react-dom/client";
import ${componentName} from "${componentPath}";

const root = createRoot(document.getElementById("root"));

root.render(<${componentName} />);
`;

  fs.writeFileSync(path.resolve(extensionPath, "preview", "index.js"), code);
}

function setupWebviewPanel(extensionUri: vscode.Uri) {
  const currentColumn = vscode.window.activeTextEditor?.viewColumn ?? 1;
  const column = currentColumn + 1;

  webviewPanel = vscode.window.createWebviewPanel(
    "localhostBrowserPreview",
    "LocalHost Preview",
    column,
    {
      // Enable javascript in the webview
      enableScripts: true,
      // And restrict the webview to only loading content from our extension's `media` directory.
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    }
  );

  webviewPanel.title = "LocalHost Preview";

  /**
   * Set up HTML that will be inside the webview
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

/**
 * Webpack server for jsx and tsx files
 */
function startWebpackServer(extensionPath: string) {
  const webpackConfig = createWebpackConfig(extensionPath);

  const compiler = Webpack(webpackConfig);
  const devServerOptions = { ...webpackConfig.devServer, open: false };
  server = new WebpackDevServer(devServerOptions, compiler);

  return new Promise<void>((resolve, reject) => {
    server!.startCallback((err) => {
      if (err) {
        return reject(err);
      }
      console.log("Started webpack server!");
      return resolve();
    });
  });
}

function stopWebpackServer() {
  return new Promise<void>((resolve, reject) => {
    if (!server) {
      console.log("There is no server to destroy!");
      return resolve();
    }

    server.stopCallback((err) => {
      if (err) {
        return reject(err);
      }
      server = undefined;
      console.log("Stopped webpack server!");
      return resolve();
    });
  });
}

/**
 * Basic node http server for html files
 */
function startHttpServer() {}

function stopHttpServer() {}

function disposeAll(disposables: vscode.Disposable[]): void {
  while (disposables.length) {
    const item = disposables.pop();
    if (item) {
      item.dispose();
    }
  }
}
