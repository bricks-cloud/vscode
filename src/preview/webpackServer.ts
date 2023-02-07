import Webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { createWebpackConfig } from "./webpackConfig";

let server: WebpackDevServer | undefined;

export function startWebpackServer(extensionPath: string) {
  const webpackConfig = createWebpackConfig(extensionPath);

  const compiler = Webpack(webpackConfig);
  const devServerOptions = { ...webpackConfig.devServer, open: false };
  server = new WebpackDevServer(devServerOptions, compiler);

  return new Promise<void>((resolve, reject) => {
    server!.startCallback((err) => {
      if (err) {
        return reject(err);
      }
      console.log("Started webpack server!");
      return resolve();
    });
  });
}

export function stopWebpackServer() {
  return new Promise<void>((resolve, reject) => {
    if (!server) {
      console.log("There is no server to destroy!");
      return resolve();
    }

    server.stopCallback((err) => {
      if (err) {
        return reject(err);
      }
      server = undefined;
      console.log("Stopped webpack server!");
      return resolve();
    });
  });
}
