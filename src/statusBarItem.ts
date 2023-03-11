import { StatusBarItem, window, StatusBarAlignment, workspace } from "vscode";

let statusBarItem: StatusBarItem | undefined;

export function initialize() {
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 1000);

  showActivate();

  // allow users to hide button if they want
  const showOnStatusBarItem = workspace
    .getConfiguration("bricksDesignToCode.settings")
    .get("showStatusBarItem");

  if (showOnStatusBarItem) {
    statusBarItem.show();
  }
}

export function showActivate() {
  if (!statusBarItem) {
    return;
  }

  statusBarItem.text = `$(zap) Activate Bricks`;
  statusBarItem.command = "bricksDesignToCode.activate";
  statusBarItem.tooltip = "Click to activate Bricks";
}

export function showLoading() {
  if (!statusBarItem) {
    return;
  }

  statusBarItem.text = `$(loading) Loading...`;
  statusBarItem.tooltip = "If it takes long time, try reloading VS Code";
  statusBarItem.command = undefined;
}

export function showShutdown() {
  if (!statusBarItem) {
    return;
  }

  statusBarItem.text = `$(close) Shut down Bricks`;
  statusBarItem.command = "bricksDesignToCode.shutDown";
  statusBarItem.tooltip = "Click to shut down Bricks";
}

export function dispose() {
  if (!statusBarItem) {
    return;
  }
  statusBarItem.dispose();
}
