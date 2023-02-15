// Credits: https://github.com/microsoft/vscode-livepreview
import * as vscode from "vscode";
import type http from "http";
import path from "path";
import fs from "fs";
import express from "express";

export const localhostPort = 4000;
let server: http.Server | undefined;

export function startServer(
  extensionUri: string,
  storageUri: vscode.Uri
): Promise<void> {
  const app = express();

  app.use(function (req, res, next) {
    console.log(req.url);

    if (req.url && req.url.endsWith(".jsx")) {
      let content: string;
      try {
        content = fs.readFileSync(storageUri.path + req.url).toString();
      } catch {
        return res.status(404);
      }

      const compiledCode = require("@babel/core").transformSync(content, {
        presets: [require.resolve("@babel/preset-react")],
      }).code;

      res.type("js");

      return res.send(compiledCode);
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
