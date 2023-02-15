// Credits: https://github.com/microsoft/vscode-livepreview
import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import * as vscode from "vscode";

export const localhostPort = 4000;
let server: http.Server | undefined;

export function startServer(
  extensionUri: string,
  storageUri: vscode.Uri
): Promise<void> {
  server = http.createServer(function (
    req: IncomingMessage,
    res: ServerResponse
  ) {
    let filePath: string;

    if (!req.url) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (req.url === "/") {
      filePath = path.join(extensionUri, "preview", "index.html");
    } else {
      const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.path;

      if (!workspacePath) {
        res.writeHead(500);
        res.end();
        return;
      }

      filePath = path.join(storageUri.path, req.url);
    }

    console.log("filePath:", filePath); // TODO: should read from storage url

    let stream = fs.createReadStream(filePath);

    stream.on("error", function () {
      res.writeHead(404);
      res.end();
    });

    stream.pipe(res);
  });

  return new Promise<void>((resolve) => {
    server!.listen(localhostPort, () => {
      console.log("Started server!");
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
      console.log("Stopped webpack server!");
      return resolve();
    });
  });
}
