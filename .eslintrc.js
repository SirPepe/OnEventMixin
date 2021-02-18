module.exports = {
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    jest: true,
    es2020: true,
    browser: true,
    node: true,
  },
};
