// Credits: https://github.com/microsoft/vscode-livepreview
import Webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import createWebpackConfig from "./createWebpackConfig";

// const port = 4000;
let server: WebpackDevServer | undefined;

export function start(extensionPath: string): void {
  const webpackConfig = createWebpackConfig(extensionPath);

  const compiler = Webpack(webpackConfig);
  const devServerOptions = { ...webpackConfig.devServer, open: false };
  server = new WebpackDevServer(devServerOptions, compiler);

  server.startCallback(() => {
    console.log("started server");
  });
}

export function end(): void {
  if (server) {
    server.stopCallback(() => {
      console.log("closed server");
      server = undefined;
    });
  }
}
