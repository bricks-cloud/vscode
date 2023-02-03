// Credits: https://github.com/microsoft/vscode-livepreview
import * as vscode from "vscode";
import * as server from "./server";
import fs from "fs";
import path from "path";
import createJSTemplate from "./createJSTemplate";

export const PORTNUM = 4000;
export class BrowserPreview {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: BrowserPreview | undefined;

  public static readonly viewType = "localhostBrowserPreview";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _isServerOn = false;

  public static createOrShow(extensionUri: vscode.Uri) {
    const currentColumn = vscode.window.activeTextEditor?.viewColumn ?? 1;
    const column = currentColumn + 1;

    // If we already have a panel, show it.
    if (BrowserPreview.currentPanel) {
      BrowserPreview.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      BrowserPreview.viewType,
      "LocalHost Preview",
      column,
      getWebviewOptions(extensionUri)
    );

    BrowserPreview.currentPanel = new BrowserPreview(panel, extensionUri);

    // open server
    BrowserPreview.currentPanel._isServerOn = BrowserPreview.openServer(
      extensionUri.path
    );
    // Set the webview's initial html content
    BrowserPreview.refreshBrowserPreview(extensionUri.path);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    console.log("revived!");
    BrowserPreview.currentPanel = new BrowserPreview(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Triggered when the panel is destroyed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    BrowserPreview.currentPanel = undefined;
    BrowserPreview.closeServer();

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  public static refreshBrowserPreview(extensionPath: string) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showInformationMessage(
        "You have to open a file first before previewing."
      );
      return;
    }

    const currentComponentPath = editor.document.uri.path;
    const activeFileName = currentComponentPath.split("/").pop() as string;
    const currentComponentName = activeFileName.split(".")[0];

    fs.writeFileSync(
      path.resolve(extensionPath, "preview", "index.js"),
      createJSTemplate(currentComponentPath, currentComponentName)
    );

    if (this.currentPanel) {
      this.currentPanel._setHtml(this.currentPanel._panel.webview);
      vscode.window.showInformationMessage("refreshed preview");
    }
  }

  public static openServer(extensionPath: string): boolean {
    server.start(extensionPath);
    vscode.window.showInformationMessage("started server");
    return true;
  }

  public static closeServer() {
    if (this.currentPanel) {
      if (this.currentPanel._isServerOn) {
        server.end();
        this.currentPanel._isServerOn = false;
        vscode.window.showInformationMessage("closed server");
      } else {
        vscode.window.showInformationMessage("server already closed");
      }
    }
  }

  private _setHtml(webview: vscode.Webview) {
    this._panel.title = "LocalHost Preview";

    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    this._panel.webview.html = `<!DOCTYPE html>
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
  }
}

export function getWebviewOptions(
  extensionUri: vscode.Uri
): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}
