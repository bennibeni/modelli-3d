import { defineConfig } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import baseConfig from "./eslint.config.mjs";

export default defineConfig([
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,mjs}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
]);
