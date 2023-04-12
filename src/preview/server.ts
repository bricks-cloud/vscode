import * as vscode from "vscode";
import { Utils } from "vscode-uri";
import type http from "http";
import express from "express";
import * as esbuild from "esbuild-wasm";
import getPort, { portNumbers } from "get-port";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import postcssPresetEnv from "postcss-preset-env";
import tailwindcss from "tailwindcss";
import { sassPlugin } from "esbuild-sass-plugin";
import fs from "fs";

let previewServerPort: number | undefined;
let server: http.Server | undefined;

function requireUncached(module: string) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

export async function startServer(
  extensionUri: vscode.Uri,
  storageUri: vscode.Uri
): Promise<void> {
  previewServerPort = await getPort({ port: portNumbers(4000, 5000) });

  const app = express();

  app.use(async function (req, res, next) {
    if (req.url === "/index.js") {
      let esbuildConfig: esbuild.BuildOptions = {
        entryPoints: [
          Utils.resolvePath(extensionUri, "./preview", "./index.js").fsPath,
        ],
        nodePaths: [Utils.resolvePath(extensionUri, "./node_modules").fsPath],
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
      const twcssFilePath = Utils.resolvePath(
        storageUri,
        "tailwind.config.js"
      ).fsPath;
      const cssFilePath = Utils.resolvePath(storageUri, "style.css").fsPath;
      if (fs.existsSync(twcssFilePath)) {
        let twcssConfig = requireUncached(twcssFilePath);

        twcssConfig.content = twcssConfig.content.map(
          (originalPath: string) => {
            const parts = originalPath.split("/");
            const matchedFileFormat = parts[parts.length - 1];
            return Utils.resolvePath(storageUri, matchedFileFormat).fsPath;
          }
        );

        esbuildConfig.plugins = [
          sassPlugin({
            async transform(source: string, resolveDir: string) {
              const { css } = await postcss([
                tailwindcss(twcssConfig),
                autoprefixer,
                postcssPresetEnv,
              ]).process(source, { from: undefined });

              return css;
            },
            type: "style",
            filter: /.(s[ac]ss|css)$/,
          }),
        ];
      } else if (fs.existsSync(cssFilePath)) {
        esbuildConfig.plugins = [
          sassPlugin({
            async transform(source: string, resolveDir: string) {
              const { css } = await postcss([
                autoprefixer,
                postcssPresetEnv,
              ]).process(source, { from: undefined });

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

  app.use(express.static(Utils.resolvePath(extensionUri, "preview").fsPath));
  app.use(express.static(storageUri.fsPath));

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
      console.log("Stopped live preview server!");
      return resolve();
    });
  });
}

export function getServerPort() {
  return previewServerPort;
}
