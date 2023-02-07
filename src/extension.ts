import * as vscode from "vscode";
import { FileSystemProvider } from "./fileExplorer";
import { Server } from "socket.io";
import * as Preview from "./preview";

interface File {
  content: string,
  path: string,
}

export class FileExplorer {
  private readonly bricksFileSystem: FileSystemProvider;

  constructor(
    context: vscode.ExtensionContext,
    bricksFileSystem: FileSystemProvider
  ) {
    this.bricksFileSystem = bricksFileSystem;

    const { storageUri } = context;
    if (!storageUri?.toString()) {
      vscode.window.showInformationMessage(
        "Open a workspace to start using Bricks Design to Code Tool"
      );
      return;
    }

    this.bricksFileSystem.createDirectory(
      vscode.Uri.parse(storageUri.toString() + "/bricks-workspace")
    );
    this.bricksFileSystem.writeFile(
      vscode.Uri.parse(
        storageUri.toString() + "/bricks-workspace/GeneratedComponent.jsx"
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

    vscode.commands.registerCommand("bricksDesignToCode.refresh", () =>
      this.bricksFileSystem.refresh()
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
    vscode.commands.registerCommand("preview.show", () => {
      Preview.createOrShow(context.extensionUri);
    })
  );

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
        const files = data as File[];

        const deleteUri = vscode.Uri.parse(
          storageUri.toString() + "/bricks-workspace"
        );

        const result = treeDataProvider.delete(deleteUri, { recursive: true });

        if (result) {
          result.then(() => {
            files.forEach(({ content, path }) => {
              const uri = vscode.Uri.parse(
                storageUri.toString() + path
              );

              Buffer.from(content);

              treeDataProvider.writeFile(uri, Buffer.from(content), {
                create: true,
                overwrite: true,
              });

              treeDataProvider.refresh();
              
              callback({
                status: "ok",
              });
            });
          });
        }
      });
    });
  }
}

export async function deactivate() { }
