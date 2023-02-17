import * as vscode from "vscode";
import type http from "http";
import path from "path";
import express from "express";
import * as esbuild from "esbuild-wasm";
import getPort, { portNumbers } from "get-port";

let previewServerPort: number | undefined;
let server: http.Server | undefined;

export async function startServer(
  extensionUri: string,
  storageUri: vscode.Uri
): Promise<void> {
  previewServerPort = await getPort({ port: portNumbers(4000, 5000) });

  const app = express();

  app.use(function (req, res, next) {
    console.log(req.url);

    if (req.url === "/index.js") {
      const result = esbuild.buildSync({
        entryPoints: [path.resolve(extensionUri, "preview", "index.js")],
        nodePaths: [path.resolve(extensionUri, "node_modules")],
        bundle: true,
        write: false,
        loader: {
          ".js": "jsx",
          ".html": "text",
          ".svg": "dataurl",
          ".png": "dataurl",
        },
        jsx: "automatic",
        define: {
          "process.env.NODE_ENV": `"production"`,
        },
      });

      if (result.errors.length > 0) {
        return res.status(500).send(result.errors);
      }

      const bundledCode = result.outputFiles[0].text;

      return res.type("js").send(bundledCode);
    }

    next();
  });

  app.use(express.static(path.join(extensionUri, "preview")));
  app.use(express.static(storageUri.path));

  return new Promise<void>((resolve) => {
    server = app.listen(previewServerPort, () => {
      console.log("Started express server!");
      return resolve();
    });
  });
}

export function endServer(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!server) {
      console.log("There is no server to destroy!");
      return resolve();
    }

    server.close((err) => {
      if (err) {
        return reject(err);
      }
      server = undefined;
      console.log("Stopped express server!");
      return resolve();
    });
  });
}

export function getServerPort() {
  return previewServerPort;
}
