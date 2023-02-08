import * as vscode from "vscode";
import fs from "fs";
import path from "path";

export function writeEntryFile(extensionPath: string) {
  const languageId = vscode.window.activeTextEditor?.document.languageId || "";

  switch (languageId) {
    case "typescriptreact":
    case "javascriptreact":
      writeEntryFileForReact(extensionPath);
      break;
    case "html":
      writeEntryFileForHtml(extensionPath);
      break;
    default:
      vscode.window.showInformationMessage(
        "Cannot preview file. Only jsx, tsx, and html files are supported."
      );
      return;
  }
}

function writeEntryFileForReact(extensionPath: string) {
  const componentPath = vscode.window.activeTextEditor!.document.uri.path;
  const activeFileName = componentPath.split("/").pop() as string;
  const componentName = activeFileName.split(".")[0];

  const code = `import { createRoot } from "react-dom/client";
import ${componentName} from "${componentPath}";

const root = createRoot(document.getElementById("root"));

root.render(<${componentName} />);
`;

  fs.writeFileSync(path.resolve(extensionPath, "preview", "index.js"), code);
}

function writeEntryFileForHtml(extensionPath: string) {
  const fileContent = vscode.window.activeTextEditor!.document.getText();

  const code = `
const root = document.getElementById("root");

root.innerHTML = "${fileContent.trim()}";
`;

  fs.writeFileSync(path.resolve(extensionPath, "preview", "index.js"), code);
}