import fs from "fs";
import { babel } from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import license from "rollup-plugin-license";
import commonjs from "@rollup/plugin-commonjs";

const babelConfig = JSON.parse(
  fs.readFileSync(".babelrc", { encoding: "utf-8" })
);

const banner = {
  content:
    "OnEventMixin | Copyright (C) 2021 Peter Kröner | peter@peterkroener.de | Dual license GPL-3.0-only/commercial",
  commentStyle: "ignored",
};

const esmConfig = {
  external: [/@babel\/runtime/, /core-js/],
  plugins: [
    babel({
      babelHelpers: "runtime",
      exclude: "node_modules/**",
      ...babelConfig,
      plugins: [...babelConfig.plugins, "@babel/plugin-transform-runtime"],
    }),
  ],
};

const minConfig = {
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: "inline",
      exclude: "node_modules/**",
      ...babelConfig,
    }),
  ],
};

export default [
  {
    input: "src/oneventmixin.js",
    output: {
      file: "dist/esm/oneventmixin.js",
      format: "esm",
      plugins: [license({ banner })],
    },
    ...esmConfig,
  },
  {
    input: "src/oneventmixin.js",
    output: {
      file: "dist/min/oneventmixin.min.js",
      format: "umd",
      name: "OnEventMixin",
      plugins: [terser(), license({ banner })],
    },
    ...minConfig,
  },
];
