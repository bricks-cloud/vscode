import * as vscode from "vscode";
import fs from "fs";
import { Utils } from "vscode-uri";

export function writeEntryFile(
  extensionUri: vscode.Uri,
  mainFileUri: vscode.Uri
) {
  const fileExtension = Utils.extname(mainFileUri);

  switch (fileExtension) {
    case ".tsx":
    case ".jsx":
      writeEntryFileForReact(extensionUri, mainFileUri);
      break;
    case ".html":
      writeEntryFileForHtml(extensionUri, mainFileUri);
      break;
    default:
      vscode.window.showInformationMessage(
        "Cannot preview file. Only jsx, tsx, and html files are supported."
      );
      return;
  }
}

function getPath(uri: vscode.Uri) {
  if (process.platform === "win32") {
    return uri.path.slice(1).replace(/\//g, "\\\\");
  } else {
    return uri.path;
  }
}

const entryFileTemplate = (
  componentName: string,
  activeDocumentUri: vscode.Uri,
  format: string
) => {
  const cssFileUri = Utils.resolvePath(
    Utils.dirname(activeDocumentUri),
    "./style.css"
  );

  let importCSSFile = false;

  try {
    if (fs.existsSync(cssFileUri.fsPath) && format === "html") {
      importCSSFile = true;
    }
  } catch (err) {}

  const cssImportStatement = `import "${getPath(cssFileUri)}";`;

  return `import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import ${componentName} from "${getPath(activeDocumentUri)}";
${importCSSFile ? cssImportStatement : ""}
  
  const App = () => {
    const [checked, setChecked] = useState(false);
  
    const handleToggle = (e) => {
      setChecked(checked => {
        document.body.style.backgroundColor = checked ? "white" : "black";
        return !checked;
      });
    };
  
    return (
      <div>
        ${
          format === "html"
            ? `<div dangerouslySetInnerHTML={{ __html: ${componentName} }}></div>`
            : `<${componentName} />`
        }
        <div className="toggle">
          <input onChange={handleToggle} type="checkbox" id="switch" /><label for="switch">Toggle</label>
        </div>
      </div>
    );
  }
  
  const root = createRoot(document.getElementById("root"));
  
  root.render(<App />);
  `;
};

function writeEntryFileForReact(
  extensionUri: vscode.Uri,
  activeDocumentUri: vscode.Uri
) {
  const componentName = Utils.basename(activeDocumentUri).split(".")[0];

  fs.writeFileSync(
    Utils.resolvePath(extensionUri, "./preview", "./index.js").fsPath,
    entryFileTemplate(componentName, activeDocumentUri, "react")
  );
}

function writeEntryFileForHtml(
  extensionUri: vscode.Uri,
  activeDocumentUri: vscode.Uri
) {
  fs.writeFileSync(
    Utils.resolvePath(extensionUri, "./preview", "./index.js").fsPath,
    entryFileTemplate("htmlstring", activeDocumentUri, "html")
  );
}
