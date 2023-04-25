import fs from "fs-extra";
import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { FileSystemProvider } from "./fileExplorer";

export const exportFiles =
  (storageUri: vscode.Uri, treeDataProvider: FileSystemProvider) =>
  async () => {
    const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;

    console.log("defaultUri", defaultUri);

    const selectedUris = await vscode.window.showOpenDialog({
      title: "Select a folder to save the files",
      openLabel: "Select",
      canSelectFolders: true,
      canSelectFiles: false,
      defaultUri,
    });

    const destinationDirUri = selectedUris?.[0];

    if (destinationDirUri) {
      const files = (await treeDataProvider.readDirectory(storageUri)).map(
        ([name]) => name
      );

      for (const file of files) {
        const sourceUri = Utils.joinPath(storageUri, file);
        const destinationUri = Utils.joinPath(destinationDirUri, file);
        await fs.copy(sourceUri.fsPath, destinationUri.fsPath);
        console.log("Copied", sourceUri.fsPath, "to", destinationUri.fsPath);
      }
    } else {
      console.log("No file selected.");
    }
  };
