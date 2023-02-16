// Credits: https://github.com/microsoft/vscode-livepreview
import * as vscode from "vscode";
import type http from "http";
import path from "path";
import express from "express";
import * as esbuild from "esbuild-wasm";

export const localhostPort = 4000;
let server: http.Server | undefined;

export function startServer(
  extensionUri: string,
  storageUri: vscode.Uri
): Promise<void> {
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
        },
        jsx: "automatic",
      });

      const bundledCode = result.outputFiles[0].text;

      res.type("js");

      return res.send(bundledCode);
    } else {
      next();
    }
  });

  app.use(express.static(path.join(extensionUri, "preview")));
  app.use(express.static(storageUri.path));

  return new Promise<void>((resolve) => {
    server = app.listen(localhostPort, () => {
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
