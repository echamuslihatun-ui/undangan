import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "public/sw.js",
    "prisma/migrate-jsonb.js",
    "prisma/seed-admin.js",
  ]),
  ...nextVitals,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
]);
