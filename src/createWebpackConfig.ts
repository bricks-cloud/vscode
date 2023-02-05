import * as path from "path";
import * as Webpack from "webpack";

const createWebpackConfig = (extensionPath: string): Webpack.Configuration => {
  const cssLoaderList = ["style-loader", "css-loader"].map((loader) =>
    require.resolve(loader)
  );

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
          use: ["htmlLoader"],
        },
        {
          test: /\.(tsx|ts|jsx|js)$/,
          exclude: /node_modules/,
          use: {
            loader: require.resolve("ts-loader"),
            options: {
              configFile: path.resolve(extensionPath, "tsconfig.preview.json"),
            },
          },
        },
        {
          test: /\.css$/,
          use: cssLoaderList,
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: require.resolve("file-loader"),
            },
          ],
        },
        {
          test: /\.(ttf|eot|woff|woff2)$/,
          use: [
            {
              loader: require.resolve("file-loader"),
            },
          ],
        },
      ],
    },
    cache: true,
    stats: "errors-only",
    //@ts-ignore
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

export default createWebpackConfig;
