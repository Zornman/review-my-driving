import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.Config} */
export default [
  {
    files: ["functions/src/**/*.{js,ts}"], // Ensure it targets the right folder
    ignores: ["node_modules/", "dist/", "lib/"], // Ignore unnecessary folders
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "off",
      "no-empty": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off"
    },
  },
  {
    files: ["functions/**/*.js"],
    languageOptions: {
      sourceType: "script",
    },
  },
];