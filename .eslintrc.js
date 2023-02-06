module.exports = {
  root: true,
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    "@typescript-eslint/no-use-before-define": [
      "error",
      { functions: false, classes: true, variables: true, typedefs: false },
    ],
    "no-dupe-class-members": "off",
    "@typescript-eslint/no-dupe-class-members": "warn",
    "no-duplicate-imports": "off",
    "@typescript-eslint/no-duplicate-imports": "warn",
    "no-extra-parens": "off",
    "@typescript-eslint/no-extra-parens": "warn",
    "no-invalid-this": "off",
    "@typescript-eslint/no-invalid-this": "warn",
    "no-loop-func": "off",
    "@typescript-eslint/no-loop-func": "warn",
    "no-loss-of-precision": "off",
    "@typescript-eslint/no-loss-of-precision": "error",
    "no-redeclare": "off",
    "@typescript-eslint/no-redeclare": "warn",
    "@typescript-eslint/no-shadow": "warn",
    "@typescript-eslint/no-useless-constructor": "warn",
    "@typescript-eslint/no-redeclare": "warn",
    "@typescript-eslint/unified-signatures": "warn",
    "@typescript-eslint/prefer-ts-expect-error": "warn",
    "@typescript-eslint/prefer-literal-enum-member": "warn",
    "@typescript-eslint/prefer-for-of": "warn",
    "@typescript-eslint/no-dynamic-delete": "warn",
    "@typescript-eslint/no-confusing-non-null-assertion": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "off",
    // Tends to interfere with prettier adding extra unnecessary parentheses
    "@typescript-eslint/no-extra-parens": "off",
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          // with the normalization of "& {}" usage in typescript 4.8, this error creates too many false positives
          "{}": false,
        },
      },
    ],
    "prettier/prettier": "warn",
  },
  parser: "@typescript-eslint/parser",
  overrides: [
    {
      files: ["*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
}
