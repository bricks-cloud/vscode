import * as vscode from "vscode";

export class UriHandler implements vscode.UriHandler {
  handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
    let message = "Handled a Uri!";
    if (uri.query) {
      message += ` It came with this query: ${uri.query}`;
    }
    console.log(message);
  }
}
