import * as vscode from "vscode";
import { File, FileExplorer, FileSystemProvider } from "./fileExplorer";
import { Server } from "socket.io";
import * as Preview from "./preview";

export async function activate(context: vscode.ExtensionContext) {
  const { storageUri } = context;

  if (!storageUri) {
    return;
  }

  /**
   * Live preview
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("bricksDesignToCode.preview.show", () => {
      Preview.createOrShow(context.extensionUri, storageUri);
    })
  );

  /**
   * Initialize Bricks workspace
   */
  const treeDataProvider = new FileSystemProvider(storageUri);
  new FileExplorer(context, treeDataProvider);

  /**
   * Initialize socket server
   */
  const io = new Server(32044, {
    maxHttpBufferSize: 1e8,
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.emit("pong", "pong");

    socket.on("code-generation", async (data, callback) => {
      await treeDataProvider.delete(storageUri, { recursive: true });

      const files: File[] = data.files;

      // write generated files to Bricks workspace
      await Promise.all(
        files.map(async ({ content, path }) => {
          const uri = vscode.Uri.parse(storageUri.toString() + path);

          Buffer.from(content);

          return treeDataProvider.writeFile(uri, Buffer.from(content), {
            create: true,
            overwrite: true,
          });
        })
      );

      treeDataProvider.refresh();

      // open the main file in the editor
      const mainFilePath = files.find((file) =>
        file.path.includes("GeneratedComponent")
      )?.path;

      const textDocument = await vscode.workspace.openTextDocument(
        vscode.Uri.parse(storageUri.toString() + mainFilePath)
      );

      await vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One);

      // show a preview of the main file
      Preview.createOrShow(context.extensionUri, storageUri);

      callback({
        status: "ok",
      });
    });
  });
}

export async function deactivate() {}
