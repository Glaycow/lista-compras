// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettierConfig = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "@angular/forms",
              "allowImportNames": ["ControlValueAccessor", "NG_VALUE_ACCESSOR"],
              "message": "Este projeto usa Signal Forms. Prefira '@angular/forms/signals'. Apenas ControlValueAccessor/NG_VALUE_ACCESSOR são permitidos para bridge de compatibilidade."
            }
          ]
        }
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
  prettierConfig,
);
