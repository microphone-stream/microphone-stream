module.exports = {
  extends: '../.eslintrc.js',
  "env": {
    "browser": true,
    "node": true,
    "mocha": true
  },
  rules: {
    'no-console': 0,
    'require-jsdoc': 0,
    'max-nested-callbacks': [1, 5],
    'no-invalid-this': 'off'
  }
};
