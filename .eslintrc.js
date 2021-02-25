module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "google",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    "prettier/prettier": ["error"],
    "max-len": "off",
    "no-inline-comments": "off",
    "no-var": "off",
    "comma-dangle": "off",
    "prefer-rest-params": "off",
  },
};
