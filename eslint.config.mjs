import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "dist/**",
    "**/*.min.js",
    "coverage/**",
    "**/__tests__/**",
    "**/tests/**",
    "**/test/**",
    "**/*.test.{js,jsx,ts,tsx}",
    "**/*.spec.{js,jsx,ts,tsx}"
  ]),
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    rules: {
      // Variable and import rules
      "no-unused-vars": "off", // Turn off base rule
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-console": ["warn", {
        "allow": ["warn", "error"]
      }],

      // React/Next.js specific
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react/no-unescaped-entities": "warn",

      // Code quality
      "no-debugger": "warn",
      "no-duplicate-imports": "warn",
      "prefer-const": "warn",
      "no-var": "error",

      // TypeScript specific
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/ban-ts-comment": "warn"
    },
  },
]);

export default eslintConfig;
