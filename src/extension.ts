import * as vscode from "vscode";
import { UriHandler } from "./UriHandler";
import { FileExplorer } from "./fileExplorer";

export async function activate(context: vscode.ExtensionContext) {
  console.log("Extension started");

  new FileExplorer(context);

  // Uri handling
  let disposable = vscode.commands.registerCommand(
    "bricksDesignToCode.handleUri",
    async () => {
      const uriHandler = new UriHandler();

      context.subscriptions.push(vscode.window.registerUriHandler(uriHandler));

      const uri = await vscode.env.asExternalUri(
        vscode.Uri.parse(`${vscode.env.uriScheme}://bricks.d2c-vscode`)
      );

      console.log(
        `Starting to handle Uris. Open ${uri} in your browser to test.`
      );
    }
  );

  context.subscriptions.push(disposable);
}
