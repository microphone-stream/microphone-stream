module.exports = {
  plugins: ["prettier"],
  extends: ["google", "prettier"],
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
