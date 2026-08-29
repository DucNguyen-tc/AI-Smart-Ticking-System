import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^(next|_)$",
          "varsIgnorePattern": "^_"
        }
      ]
    }
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);
