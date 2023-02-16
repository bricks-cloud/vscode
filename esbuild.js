const { build } = require("esbuild");

build({
  entryPoints: ["./src/extension.ts"],
  minify: false,
  bundle: true,
  outdir: "./out",
  external: ["vscode", "esbuild-wasm"],
  platform: "node",
}).catch((err) => {
  process.stderr.write(err.stderr);
  process.exit(1);
});
