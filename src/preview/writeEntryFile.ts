import * as vscode from "vscode";
import fs from "fs";
import path from "path";

export function writeEntryFile(extensionFsPath: string, mainFilePath: string) {
  const parts = mainFilePath?.split('.');
  const fileExtension = Array.isArray(parts) ? parts[parts.length - 1] : "";

  switch (fileExtension) {
    case "tsx":
    case "jsx":
      writeEntryFileForReact(extensionFsPath, mainFilePath);
      break;
    case "html":
      writeEntryFileForHtml(extensionFsPath, mainFilePath);
      break;
    default:
      vscode.window.showInformationMessage(
        "Cannot preview file. Only jsx, tsx, and html files are supported."
      );
      return;
  }
}

function writeEntryFileForReact(extensionPath: string, activeDocumentPath: string) {

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

function writeEntryFileForHtml(extensionPath: string, activeDocumentPath: string) {
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
