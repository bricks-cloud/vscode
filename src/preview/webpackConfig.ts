import * as path from "path";
import * as Webpack from "webpack";
import * as vscode from "vscode";

export const createWebpackConfig = (
  extensionPath: string,
): Webpack.Configuration => {
  const activeTextEditor = vscode.window.activeTextEditor;

  if (!activeTextEditor) {
    throw new Error("No file is currently opened!");
  }
  return {
    mode: "development",
    context: path.resolve(extensionPath, "preview"),
    entry: path.resolve(extensionPath, "preview", "index.js"),
    output: {
      filename: "bundle.js",
      path: path.resolve(extensionPath, "preview"),
    },
    plugins: [
      new Webpack.ProvidePlugin({
        React: "react",
      }),
    ],
    devtool: false,
    resolve: {
      modules: [path.resolve(extensionPath, "node_modules")],
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.(html)$/,
          use: ["html-loader"],
        },
        {
          test: /\.(tsx|ts|jsx|js)$/,
          exclude: /node_modules/,
          use: {
            loader: "esbuild-loader",
            options: {
              loader: 'jsx',
            },
          },
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: ["file-loader"],
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/,
          use: ["file-loader"],
        },
      ],
    },
    cache: true,
    stats: "errors-only",
    devServer: {
      static: {
        directory: path.resolve(extensionPath, "preview"),
        watch: true,
      },
      port: 9132,
      host: "localhost",
      client: {
        overlay: false,
        logging: "none",
      },
      hot: true,
    },
  };
};
