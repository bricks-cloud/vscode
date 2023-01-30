import * as vscode from "vscode";
import { FileExplorer } from "./fileExplorer";
import { Server } from "socket.io";

import { GeneratedCodePreviewPanel } from "./generatedCodePreviewPanel";

import * as bp from "./browserPreview";

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

  new FileExplorer(context);

  // socket server
  const io = new Server(3000, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.emit("pong", "pong");

    socket.on("selection-change", (arg) => {
      console.log(arg);
    });
  });

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
}

// function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
//   return {
//     // Enable javascript in the webview
//     enableScripts: true,

//     // And restrict the webview to only loading content from our extension's `media` directory.
//     localResourceRoots: [vscode.Uri.joinPath(extensionUri, "out")],
//   };
// }
