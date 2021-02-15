import assert from "assert";

import getUserMedia from "get-user-media-promise";
import MicrophoneStream from "../dist/microphone-stream.js";

describe("MicrophoneStream", function () {
  it("should capture audio and emit data events with buffers when in the default binary mode", function (done) {
    getUserMedia({ audio: true })
      .then(function (stream) {
        const micStream = new MicrophoneStream({ stream });
        micStream.on("error", done).on("data", function (chunk) {
          assert(chunk instanceof Buffer);
          done();
        });
      })
      .catch(done);
  });

  it("should capture audio and emit AudioBuffers when in object mode", function (done) {
    getUserMedia({ audio: true })
      .then(function (stream) {
        const micStream = new MicrophoneStream({ stream, objectMode: true });
        micStream.on("error", done).on("data", function (data) {
          assert(data instanceof AudioBuffer);
          done();
        });
      })
      .catch(done);
  });

  it("should emit a format event", function (done) {
    getUserMedia({ audio: true })
      .then(function (stream) {
        const micStream = new MicrophoneStream({ stream });
        micStream.on("error", done).on("format", function (format) {
          assert(format);
          assert.equal(format.channels, 1);
          assert.equal(format.bitDepth, 32);
          assert(format.sampleRate > 0);
          assert(format.signed);
          assert(format.float);
          done();
        });
      })
      .catch(done);
  });

  describe("stop", function () {
    it("should emit close and end events", function (done) {
      getUserMedia({ audio: true })
        .then(function (stream) {
          let closed = false;
          let ended = false;
          // eslint-disable-next-line require-jsdoc
          function check() {
            if (closed && ended) {
              done();
            }
          }
          const micStream = new MicrophoneStream({ stream });
          micStream
            .on("error", done)
            .on("close", function () {
              closed = true;
              check();
            })
            .on("end", function () {
              ended = true;
              check();
            })
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            .on("data", function () {}) // put it into flowing mode or end will never fire
            .once("data", function () {
              // wait for the first bit of data before calling stop
              micStream.stop();
            });
        })
        .catch(done);
    });

    it("should expose internal audioInput", function (done) {
      getUserMedia({ audio: true })
        .then(function (stream) {
          const micStream = new MicrophoneStream({ stream });
          assert(
            micStream.audioInput instanceof MediaStreamAudioSourceNode,
            "should return a MediaStreamAudioSourceNode"
          );
          done();
        })
        .catch(done);
    });

    it("should attempt to stop the tracks of the user media stream", function (done) {
      // eslint-disable-next-line require-jsdoc
      function getMediaTrackState(stream) {
        return stream.getTracks()[0].readyState;
      }

      getUserMedia({ audio: true }).then(function (stream) {
        assert(getMediaTrackState(stream) === "live");
        const micStream = new MicrophoneStream({ stream });
        micStream.stop();
        assert(getMediaTrackState(stream) === "ended");
        done();
      });
    });

    it("should capture audio and emit AudioBuffers with non-0 data when in object mode", function (done) {
      getUserMedia({ audio: true })
        .then(function (stream) {
          let hasNonZero = false;
          const micStream = new MicrophoneStream({ stream, objectMode: true });
          micStream
            .on("error", done)
            .on("data", function (audioBuffer) {
              if (hasNonZero) {
                micStream.stop();
                return;
              }
              const data = audioBuffer.getChannelData(0); // Float32Array
              for (let i = 0; i < data.length; i++) {
                if (data[i] !== 0) {
                  hasNonZero = true;
                  break;
                }
              }
            })
            .on("end", function () {
              assert(hasNonZero, "chunk should have some non-zero values");
              done();
            });
          setTimeout(micStream.stop.bind(micStream), 1000);
        })
        .catch(done);
    }).timeout(3000);

    it("should capture audio and emit buffers with non-0 data when in binary mode", function (done) {
      getUserMedia({ audio: true })
        .then(function (stream) {
          let hasNonZero = false;
          const micStream = new MicrophoneStream({ stream });
          micStream
            .on("error", done)
            .on("data", function (chunk) {
              if (hasNonZero) {
                micStream.stop();
                return;
              }
              for (let i = 0; i < chunk.length; i++) {
                if (chunk[i] !== 0) {
                  hasNonZero = true;
                  break;
                }
              }
            })
            .on("end", function () {
              assert(hasNonZero, "chunk should have some non-zero values");
              done();
            });
          setTimeout(micStream.stop.bind(micStream), 1000);
        })
        .catch(done);
    }).timeout(3000);
  });

  describe("toRaw", function () {
    it("should convert fro a buffer to a Float32Array without copying data", function () {
      const source = new Buffer([0, 0, 0x80, 0x3f]);
      const actual = MicrophoneStream.toRaw(source);
      assert(actual instanceof Float32Array, "it should return a Float32Array");
      assert.equal(actual.length, 1, "the converted Float32Array length");
      assert.equal(actual[0], 1, "converted Float32Array data value");
      assert.equal(
        actual.buffer,
        source.buffer,
        "should have the same underlying buffer"
      );
    });
  });
});
