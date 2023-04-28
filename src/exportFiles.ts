import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import { FileSystemProvider } from "./fileExplorer";
import {
  trackExportFilesFromContextMenu,
  trackExportFilesFromSaveIcon,
} from "./amplitude";

export const exportFiles =
  (
    storageUri: vscode.Uri,
    treeDataProvider: FileSystemProvider,
    exportAllFiles: boolean
  ) =>
  async (lastSelectedItem: any, currentlySelectedItems: any[] | undefined) => {
    const defaultUri = vscode.workspace.workspaceFolders?.[0]?.uri;

    const selectedUris = await vscode.window.showOpenDialog({
      title: "Select a folder to save the files",
      openLabel: "Select",
      canSelectFolders: true,
      canSelectFiles: false,
      defaultUri,
    });

    const destinationDirUri = selectedUris?.[0];

    if (!destinationDirUri) {
      console.log("No file selected.");
      return;
    }

    // export all files and directories under storageUri be default
    let fileUris = (await treeDataProvider.readDirectory(storageUri)).map(
      ([name]) => Utils.joinPath(storageUri, name)
    );

    if (!exportAllFiles && lastSelectedItem) {
      fileUris = [lastSelectedItem.uri];
    }

    if (!exportAllFiles && currentlySelectedItems) {
      fileUris = currentlySelectedItems.map((item) => item.uri);
    }

    for (const fileUri of fileUris) {
      const newLocal = path.relative(storageUri.fsPath, fileUri.fsPath);
      const destinationPath = Utils.joinPath(
        destinationDirUri,
        newLocal
      ).fsPath;

      await fs.copy(fileUri.fsPath, destinationPath);
    }

    if (exportAllFiles) {
      trackExportFilesFromSaveIcon();
    } else {
      trackExportFilesFromContextMenu();
    }
  };
