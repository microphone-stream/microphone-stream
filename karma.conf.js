// Karma configuration
// Generated on Fri Jan 15 2016 13:36:31 GMT-0500 (EST)
const path = require("path");

module.exports = function (config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: "",

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ["mocha", "karma-typescript"],

    // list of files / patterns to load in the browser
    files: ["src/**/*.ts"],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      "src/**/*.ts": ["karma-typescript"],
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ["progress", "karma-typescript"],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ["ChromeWithPrerecordedMic"],

    // you can define custom flags
    // there's a handy list of chrome flags at https://peter.sh/experiments/chromium-command-line-switches/
    customLaunchers: {
      ChromeWithPrerecordedMic: {
        base: "Chrome",
        flags: [
          "--use-fake-device-for-media-stream",
          "--use-fake-ui-for-media-stream",
          "--use-file-for-fake-audio-capture=" +
            path.join(__dirname, "test/resources/audio.wav"),
          "--no-sandbox",
        ],
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    karmaTypescriptConfig: {
      tsconfig: "./tsconfig.json",
      exclude: {
        mode: "replace",
        values: [],
      },
    },

    mime: {
      "text/x-typescript": ["ts"],
    },
  });
};
