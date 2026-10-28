import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { ignores: ["build/**", ".claude/**", "node_modules/**"] },
  // First, so the explicit formatting rules below stay on instead of being switched off.
  eslintConfigPrettier,
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@stylistic/spaced-comment": ["error", "always", {
        line: {
          markers: ["/"],
        },
        block: {
          markers: ["!"],
          exceptions: ["*"],
          balanced: true,
        },
      }],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/max-len": ["error", {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
      }],
      "@stylistic/semi": "error",
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Property[key.name='ephemeral'][value.value=true]",
          message: "Use 'flags: MessageFlags.Ephemeral' instead of 'ephemeral: true'.",
        },
      ],
    },
  },
];
