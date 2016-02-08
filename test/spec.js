'use strict';

var assert = require('assert');

var getUserMedia = require('getusermedia');
var MicrophoneStream = require('../microphone-stream.js');

//var expect = require('expect.js');

//var expectedAudio = fs.readFilesync('./resources/')

describe("MicrophoneStream", function() {

  it("should capture audio and emit data events with buffers when in the default binary mode", function(done) {
    getUserMedia(function(err, stream) {
      if (err) {
        return done(err);
      }

      var micStream = new MicrophoneStream(stream);
      micStream.on('error', done)
        .on('data', function(chunk) {
          assert(chunk instanceof Buffer);
        done();
      });
    });
  });

  it("should capture audio and emit AudioBuffers when in object mode", function(done) {
    getUserMedia(function(err, stream) {
      if (err) {
        return done(err);
      }

      var micStream = new MicrophoneStream(stream, {objectMode: true});
      micStream.on('error', done)
        .on('data', function(data) {
          assert(data instanceof AudioBuffer);
          done();
        });
    });
  });

  it("should emit a format event", function(done) {
    getUserMedia(function(err, stream) {
      if (err) {
        return done(err);
      }

      var micStream = new MicrophoneStream(stream);
      micStream.on('error', done)
        .on('format', function(format) {
          assert.deepEqual(format, {
            channels: 1,
            bitDepth: 32,
            sampleRate: 48000,
            signed: true,
            float: true
          });
          done();
        });
    });
  });

  describe("stop", function() {
    it("should emit close and end events", function() {
      getUserMedia(function(err, stream) {
        if (err) {
          return done(err);
        }
        var closed = false;
        var ended = false;
        function check() {
          if (closed && ended) {
            done();
          }
        }
        var micStream = new MicrophoneStream(stream);
        micStream.on('error', done)
          .on('close', function() {
            closed = true;
            check();
          })
          .on('end', function() {
            ended = true;
            check();
          })
          .on('data', function() {}) // put it into flowing mode or end will never fire
          .once('data', function() { // wait for the first bit of data before calling stop
            micStream.stop();
          });

      });
    });
  });

  describe("toRaw", function() {
    it("should convert fro a buffer to a Float32Array without copying data", function() {
      var source = new Buffer([0,0,0x80,0x3f]);
      var actual = MicrophoneStream.toRaw(source);
      assert(actual instanceof Float32Array, "it should return a Float32Array");
      assert.equal(actual.length, 1, "the converted Float32Array length");
      assert.equal(actual[0], 1, "converted Float32Array data value");
      assert.equal(actual.buffer, source.buffer, "should have the same underlying buffer");
    });
  });

});

