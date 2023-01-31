// Credits: https://github.com/microsoft/vscode-livepreview
import http, { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";
import url from "url";

const port = 4000;
let server: any;

export function start(basePath: string): void {
  server = http
    .createServer(function (req: IncomingMessage, res: ServerResponse) {
      let parsedURL = url.parse(req.url || "", true);

      let host = parsedURL.host === null ? "" : parsedURL.host;
      let urlWithoutQueries = host + parsedURL.pathname;

      let fileurl = urlWithoutQueries;

      if (urlWithoutQueries === "/") {
        fileurl = "index.html";
      }

      let stream = fs.createReadStream(path.join(basePath, fileurl));

      stream.on("error", function () {
        res.writeHead(404);
        res.end();
      });

      stream.pipe(res);
    })
    .listen(port);
  console.log("started server");
}

export function end(): void {
  server.close();
  console.log("closed server");
}
