import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { File, FileExplorer, FileSystemProvider } from "./fileExplorer";
import * as StatusBarItem from "./statusBarItem";
import { Server } from "socket.io";
import * as Preview from "./preview";
import { writeEntryFile } from "./preview/writeEntryFile";
import { createServer } from "http";
import { formatFiles, getExtensionFromFilePath } from "./util";

const message = {
  welcome:
    'To start using Bricks, click "Activate Bricks" in the status bar, or run "Activate Bricks" in the command palette ("View" > "Command Palette").',
  activated: "Activated! Go to Figma to select a component.",
  noWorkspaceOpened:
    "Open a workspace to start using Bricks Design to Code Tool",
  bricksIsActiveInAnotherWorkspace: (workspace: string) =>
    `Bricks is already active in workspace "${workspace}", or you have something running on port ${port}. Please shut it down first.`,
};

/**
 * Setting up the http server
 */
const port = 32044;
const websocketServer = createServer();

const io = new Server(websocketServer, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
  },
});

const openTextDocument = async (fileUri: vscode.Uri) => {
  const textDocument = await vscode.workspace.openTextDocument(fileUri);

  return vscode.window.showTextDocument(textDocument, vscode.ViewColumn.One);
};

export async function activate(context: vscode.ExtensionContext) {
  const { extensionUri, storageUri, globalState } = context;

  if (!storageUri) {
    vscode.window.showInformationMessage(message.noWorkspaceOpened);
    return;
  }

  /**
   * Initialize Bricks workspace
   */
  const treeDataProvider = new FileSystemProvider(storageUri);
  new FileExplorer(context, treeDataProvider);

  /**
   * Helper function for creating a placeholder file in storage
   */
  const createPlaceHolderFile = (content: string) => {
    const placeholderFileUri = vscode.Uri.parse(
      `${storageUri.toString()}/WelcomeToBricks.md`
    );

    return treeDataProvider.writeFile(
      placeholderFileUri,
      Buffer.from(content),
      {
        create: true,
        overwrite: true,
      }
    );
  };
  if (!websocketServer.listening) {
    // delete all existing files
    await treeDataProvider.delete(storageUri, { recursive: true });

    await createPlaceHolderFile(message.welcome);
    vscode.window.showInformationMessage(message.welcome);
  }

  treeDataProvider.refresh();

  /**
   * Server set up
   */
  websocketServer.on("error", function (e: Error) {
    //@ts-ignore
    if (e.code === "EADDRINUSE") {
      const currentlyActiveWorkspace = globalState.get("bricksWorkspace");

      const error = currentlyActiveWorkspace
        ? message.bricksIsActiveInAnotherWorkspace(
          currentlyActiveWorkspace as string
        )
        : `Port ${port} is in use, please shut down any process that's using that port.`;
      vscode.window.showErrorMessage(error);
    } else {
      vscode.window.showErrorMessage(
        `There was an unexpected error starting the Bricks WebSocket server. Please see console for logs.`
      );
      console.log(e);
    }

    StatusBarItem.showActivate();
  });

  /**
   * Live preview
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("bricksDesignToCode.preview.show", () => {
      Preview.createOrShow(context.extensionUri, storageUri);
    })
  );

  /**
   * Register the command for activating the plugin
   */
  vscode.commands.registerCommand("bricksDesignToCode.activate", async () => {
    StatusBarItem.showLoading();

    await createPlaceHolderFile(
      "Select Components Using the Figma Plugin to get started"
    );
    treeDataProvider.refresh();

    /**
     * Start the http server
     */
    websocketServer.listen({ port }, async () => {
      await globalState.update("bricksWorkspace", vscode.workspace.name);

      vscode.window.showInformationMessage(message.activated);

      StatusBarItem.showShutdown();
    });

    /**
     * Initialize socket server
     */
    io.on("connection", (socket) => {
      socket.emit("pong", "pong");

      socket.on("code-generation", async (data, callback) => {
        await treeDataProvider.delete(storageUri, { recursive: true });

        const files: File[] = formatFiles(data.files);

        // write generated files to Bricks workspace
        await Promise.all(
          files.map(async ({ content, path }) => {
            const uri = vscode.Uri.parse(storageUri.toString() + path);

            if (getExtensionFromFilePath(path) === "png") {

              return treeDataProvider.writeFile(uri, Buffer.from(content, "base64"), {
                create: true,
                overwrite: true,
              });
            }

            return treeDataProvider.writeFile(uri, Buffer.from(content), {
              create: true,
              overwrite: true,
            });
          })
        );

        treeDataProvider.refresh();

        // open the main file in the editor
        const mainFileUri = Utils.joinPath(
          storageUri,
          files.find((file) => file.path.includes("GeneratedComponent"))
            ?.path || ""
        );
        await openTextDocument(mainFileUri);

        // write entry files for live preview
        writeEntryFile(extensionUri, mainFileUri);

        // show a preview of the main file
        await Preview.createOrShow(context.extensionUri, storageUri);

        callback({
          status: "ok",
        });
      });
    });
  });

  /**
   * Register the command for shutting down the plugin
   */
  vscode.commands.registerCommand("bricksDesignToCode.shutDown", async () => {
    StatusBarItem.showLoading();

    await treeDataProvider.delete(storageUri, { recursive: true });
    await createPlaceHolderFile("Activate Bricks to get started");
    treeDataProvider.refresh();

    Preview.dispose();
    io.removeAllListeners();
    io.close();

    await context.globalState.update("bricksWorkspace", undefined);

    vscode.window.showInformationMessage("Bricks has been shut down.");
    StatusBarItem.showActivate();
  });

  /**
   * Create a button for activating and shutting down Bricks
   */
  StatusBarItem.initialize();
}
