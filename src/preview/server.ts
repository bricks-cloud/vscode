import * as vscode from "vscode";
import type http from "http";
import path from "path";
import express from "express";
import * as esbuild from "esbuild-wasm";
import getPort, { portNumbers } from "get-port";
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from 'tailwindcss';
import { sassPlugin } from 'esbuild-sass-plugin';
import fs from "fs";

let previewServerPort: number | undefined;
let server: http.Server | undefined;

interface arguments {
  path: string
}

const styleLoader = {
  name: 'inline-style',
  setup(build: esbuild.PluginBuild) {
    var fs = require('fs');
    var template = (css: string) =>
      `typeof document<'u'&&` +
      `document.head.appendChild(document.createElement('style'))` +
      `.appendChild(document.createTextNode(${JSON.stringify(css)}))`;
    build.onLoad({ filter: /\.css$/ }, async (args: arguments) => {
      let css = await fs.promises.readFile(args.path, 'utf8');
      return { contents: template(css) };
    });
  }
};

function requireUncached(module: string) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

export async function startServer(
  extensionUri: string,
  storageUri: vscode.Uri
): Promise<void> {
  previewServerPort = await getPort({ port: portNumbers(4000, 5000) });

  const app = express();

  app.use(async function (req, res, next) {

    if (req.url === "/index.js") {
      let esbuildConfig: esbuild.BuildOptions = {
        entryPoints: [path.resolve(extensionUri, "preview", "index.js"), path.resolve(storageUri.path, "style.css")],
        nodePaths: [path.resolve(extensionUri, "node_modules")],
        outdir: path.resolve(storageUri.path, "build"),
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
      };

      // add plugin for postcss when tailwindcss is selected
      const tWCFilePath = path.resolve(storageUri.path, "tailwind.config.js");
      if (fs.existsSync(tWCFilePath)) {
        let tWCConfig = requireUncached(tWCFilePath);

        tWCConfig.content = tWCConfig.content.map((originalPath: string) => {
          const parts = originalPath.split("/");
          const matchedFileFormat = parts[parts.length - 1];
          return path.resolve(storageUri.path, matchedFileFormat);
        });

        esbuildConfig.plugins = [
          sassPlugin({
            async transform(source: string, resolveDir: string) {
              const { css } = await postcss([tailwindcss(tWCConfig), autoprefixer, postcssPresetEnv]).process(source, { from: undefined });
              return css;
            },
            type: "style",
            filter: /.(s[ac]ss|css)$/,
          }),
        ];
      }


      const result = await esbuild.build(esbuildConfig);

      if (result.errors.length > 0) {
        return res.status(500).send(result.errors);
      }

      if (result.outputFiles) {
        return res.type("js").send(result.outputFiles[0].text);

      }

      return res.type("js").send("");
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
