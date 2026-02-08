import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import securityPlugin from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: {
      security: securityPlugin,
    },
    rules: {
      // Security plugin rules
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-unsafe-regex": "error",
    },
  },
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "supabase/functions/**", // Exclude Deno edge functions
  ]),
]);

export default eslintConfig;
