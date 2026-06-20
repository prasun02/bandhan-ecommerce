import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [".next/**", "node_modules/**", "prisma/generated/**"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        React: "readonly",
        JSX: "readonly",
        Request: "readonly",
        process: "readonly"
      }
    }
  }
];
