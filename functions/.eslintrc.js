module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "import/no-unresolved": 0,
    "indent": 0,
    "linebreak-style": 0,
    "camelcase": 0,
    "max-len": 0,
    "require-jsdoc": 0,
    "@typescript-eslint/no-explicit-any": 0,
    "comma-dangle": 0,
    "quotes": 0,
    "object-curly-spacing": 0,
    "no-trailing-spaces": 0,
    "eol-last": 0,
    "no-multi-spaces": 0,
    "padded-blocks": 0,
  },
};
