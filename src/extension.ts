import * as vscode from "vscode";
import { FileSystemProvider } from "./fileExplorer";
import { Server } from "socket.io";
import prettier from "prettier";
import * as bp from "./browserPreview";

import { GeneratedCodePreviewPanel } from "./generatedCodePreviewPanel";

export class FileExplorer {
  private readonly bricksFileSystem: FileSystemProvider;

  constructor(context: vscode.ExtensionContext, bricksFileSystem: FileSystemProvider) {
    this.bricksFileSystem = bricksFileSystem;

    if (!context.storageUri) {
      vscode.window.showInformationMessage('Open a workspace to start using Bricks Design to Code Tool');
      return;
    }

    this.bricksFileSystem.createDirectory(vscode.Uri.parse(context.storageUri.toString() + '/bricks-workspace'));
    this.bricksFileSystem.writeFile(vscode.Uri.parse(context.storageUri.toString() + '/bricks-workspace/GeneratedCode.js'), Buffer.from('/* Select components using the Figma Plugin */'), { create: true, overwrite: true });
    context.subscriptions.push(vscode.window.createTreeView('bricksWorkspace', { treeDataProvider: this.bricksFileSystem }));
    vscode.commands.registerCommand('bricksDesignToCode.openFile', (resource) => this.openResource(resource));
  }

  private openResource(resource: vscode.Uri): void {
    vscode.window.showTextDocument(resource);
  }
}

export async function deactivate() {

};

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("bricksDesignToCode.openWebview", () => {
      GeneratedCodePreviewPanel.createOrShow(context.extensionUri);
    })
  );

  // if (vscode.window.registerWebviewPanelSerializer) {
  //   // Make sure we register a serializer in activation event
  //   vscode.window.registerWebviewPanelSerializer(
  //     GeneratedCodePreviewPanel.viewType,
  //     {
  //       async deserializeWebviewPanel(
  //         webviewPanel: vscode.WebviewPanel,
  //         state: any
  //       ) {
  //         console.log(`Got state: ${state}`);
  //         // Reset the webview options so we use latest uri for `localResourceRoots`.
  //         webviewPanel.webview.options = getWebviewOptions(
  //           context.extensionUri
  //         );
  //         GeneratedCodePreviewPanel.revive(webviewPanel, context.extensionUri);
  //       },
  //     }
  //   );
  // }

  // live preview
  context.subscriptions.push(
    vscode.commands.registerCommand("server.start", () => {
      bp.BrowserPreview.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("server.preview.refresh", () => {
      bp.BrowserPreview.refreshBrowserPreview();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("server.end", () => {
      bp.BrowserPreview.closeServer();
    })
  );

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(bp.BrowserPreview.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = bp.getWebviewOptions(
          context.extensionUri
        );
        bp.BrowserPreview.revive(webviewPanel, context.extensionUri);
      },
    });
  }

  // socket server
  const io = new Server(3000, {
    cors: {
      origin: "*",
    },
  });


  const { storageUri } = context;

  if (storageUri) {
    const treeDataProvider = new FileSystemProvider(storageUri);
    new FileExplorer(context, treeDataProvider);

    io.on("connection", (socket) => {
      socket.emit("pong", "pong");

      socket.on("selection-change", (arg) => {
        console.log(arg);
      });

      socket.on("code-generation", (data) => {
        const uri = vscode.Uri.parse(storageUri.toString() + '/bricks-workspace/GeneratedCode.js');
        const formatedCode = prettier.format(insertIntoTemplate(data), { semi: true, parser: "babel" });
        treeDataProvider.writeFile(uri, Buffer.from(formatedCode), { create: true, overwrite: true });
      });
    });
  }
}

const insertIntoTemplate = (data: string) => (
  `import React from "react";\n\n const MyComponent = () => (\n${data}\n);\n\nexport default MyComponent;`
);

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
  return {
    // Enable javascript in the webview
    enableScripts: true,

    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "out")],
  };
};

// function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
//   return {
//     // Enable javascript in the webview
//     enableScripts: true,

//     // And restrict the webview to only loading content from our extension's `media` directory.
//     localResourceRoots: [vscode.Uri.joinPath(extensionUri, "out")],
//   };
// }
