import { init, track } from "@amplitude/analytics-node";
import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";

init("");

export function trackExportFilesFromSaveIcon() {
  track("export_files_click", { method: "save_icon" }, { user_id: userId });
}

export function trackExportFilesFromContextMenu() {
  track("export_files_click", { method: "context_menu" }, { user_id: userId });
}

let userId = getDefaultUserID();

// Use a randomly generated UUID as user id by default
function getDefaultUserID(): string {
  const key = "bricksDesignToCode.uniqueUserID";
  const globalState = vscode.workspace.getConfiguration().get<string>(key);

  if (globalState) {
    return globalState;
  } else {
    const newUUID = uuidv4();
    vscode.workspace
      .getConfiguration()
      .update(key, newUUID, vscode.ConfigurationTarget.Global);
    return newUUID;
  }
}

// Override default user id with the one from the Figma plugin
export function setUserId(newUserId: string) {
  userId = newUserId;
}
