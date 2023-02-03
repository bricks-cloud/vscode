import * as vscode from "vscode";
import { FileSystemProvider } from "./fileExplorer";
import { Server } from "socket.io";
import { BrowserPreview } from "./browserPreview";

export class FileExplorer {
  private readonly bricksFileSystem: FileSystemProvider;

  constructor(
    context: vscode.ExtensionContext,
    bricksFileSystem: FileSystemProvider
  ) {
    this.bricksFileSystem = bricksFileSystem;

    if (!context.storageUri) {
      vscode.window.showInformationMessage(
        "Open a workspace to start using Bricks Design to Code Tool"
      );
      return;
    }

    this.bricksFileSystem.createDirectory(
      vscode.Uri.parse(context.storageUri.toString() + "/bricks-workspace")
    );
    this.bricksFileSystem.writeFile(
      vscode.Uri.parse(
        context.storageUri.toString() + "/bricks-workspace/GeneratedCode.js"
      ),
      Buffer.from("/* Select components using the Figma Plugin */"),
      { create: true, overwrite: true }
    );
    context.subscriptions.push(
      vscode.window.createTreeView("bricksWorkspace", {
        treeDataProvider: this.bricksFileSystem,
      })
    );
    vscode.commands.registerCommand("bricksDesignToCode.openFile", (resource) =>
      this.openResource(resource)
    );
  }

  private openResource(resource: vscode.Uri): void {
    vscode.window.showTextDocument(resource);
  }
}

export async function activate(context: vscode.ExtensionContext) {
  /**
   * Live preview
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("server.start", () => {
      BrowserPreview.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("server.preview.refresh", () => {
      BrowserPreview.refreshBrowserPreview(context.extensionUri.path);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("server.end", () => {
      BrowserPreview.closeServer();
    })
  );

  // TODO: implement WebviewPanelSerializer so webviews can restore automatically when VS Code restarts

  /**
   * Socket server
   */
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

      socket.on("code-generation", (data, callback) => {
        const uri = vscode.Uri.parse(
          storageUri.toString() + "/bricks-workspace/GeneratedCode.js"
        );
        treeDataProvider.writeFile(uri, Buffer.from(data), {
          create: true,
          overwrite: true,
        });
        callback({
          status: "ok",
        });
      });
    });
  }
}

export async function deactivate() {}
