import * as vscode from "vscode";
import fs from "fs";
import path from "path";

export function writeEntryFile(extensionFsPath: string) {
  const languageId = vscode.window.activeTextEditor?.document.languageId || "";

  switch (languageId) {
    case "typescriptreact":
    case "javascriptreact":
      writeEntryFileForReact(extensionFsPath);
      break;
    case "html":
      writeEntryFileForHtml(extensionFsPath);
      break;
    default:
      vscode.window.showInformationMessage(
        "Cannot preview file. Only jsx, tsx, and html files are supported."
      );
      return;
  }
}

function writeEntryFileForReact(extensionPath: string) {
  let activeDocumentPath = vscode.window.activeTextEditor!.document.uri.path;

  if (activeDocumentPath.startsWith("/c:")) {
    // windows file path
    activeDocumentPath = activeDocumentPath.slice(1).replace(/\//g, "\\\\");
  }

  const activeFileName = path.basename(activeDocumentPath);
  const componentName = activeFileName.split(".")[0];

  const code = `import React from "react";
import { createRoot } from "react-dom/client";
import ${componentName} from "${activeDocumentPath}";

const root = createRoot(document.getElementById("root"));

root.render(<${componentName} />);
`;

  fs.writeFileSync(path.resolve(extensionPath, "preview", "index.js"), code);
}

function writeEntryFileForHtml(extensionPath: string) {
  let activeDocumentPath = vscode.window.activeTextEditor!.document.uri.path;

  if (activeDocumentPath.startsWith("/c:")) {
    // windows file path
    activeDocumentPath = activeDocumentPath.slice(1).replace(/\//g, "\\\\");
  }

  const code = `import React from "react";
import { createRoot } from "react-dom/client";
import htmlString from "${activeDocumentPath}";

const root = createRoot(document.getElementById("root"));

root.render(<div dangerouslySetInnerHTML={{ __html: htmlString }}></div>)
`;

  fs.writeFileSync(path.resolve(extensionPath, "preview", "index.js"), code);
}
