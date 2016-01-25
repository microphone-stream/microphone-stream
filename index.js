'use strict';
var Readable = require('stream').Readable;
var util = require('util');

function MicrophoneStream(stream, opts) {
  // "It is recommended for authors to not specify this buffer size and allow the implementation to pick a good
  // buffer size to balance between latency and audio quality."
  // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
  // Possible values: null, 256, 512, 1024, 2048, 4096, 8192, 16384
  var bufferSize = null;
  opts = opts || {};

  bufferSize = opts.bufferSize || bufferSize;

  // We can only emit one channel's worth of audio, so only one input. (Who has multiple microphones anyways?)
  var inputChannels = 1;
  // we shouldn't need any output channels (going back to the browser), but chrome is buggy and won't give us any audio without one
  var outputChannels = 1;

  Readable.call(this, opts);

  var self = this;
  var recording = true;
  function recorderProcess(e) {
    if (recording) { // onaudioprocess can be called at least once after we've stopped
      var raw = e.inputBuffer.getChannelData(0); // Float32Array, each sample is a number from -1 to 1
      var nodebuffer = new Buffer(raw.buffer); // node only accepts buffers or strings for streams, buffers are essentially a Uint8Array
      self.push(nodebuffer);
    }
  }

  var context = new AudioContext();
  var audioInput = context.createMediaStreamSource(stream);
  var recorder = context.createScriptProcessor(bufferSize, inputChannels, outputChannels);

  recorder.onaudioprocess = recorderProcess;

  audioInput.connect(recorder);
  recorder.connect(context.destination); // other half of workaround for chrome bugs

  this.stop = function() {
    stream.getTracks()[0].stop();
    recorder.disconnect(0);
    recording = false;
    self.push(null);
  };

  process.nextTick(function() {
    self.emit('format', {
      channels: 1,
      bitDepth: 32,
      sampleRate: context.sampleRate,
      signed: true,
      float: true
    });
  })
}
util.inherits(MicrophoneStream, Readable);

MicrophoneStream.prototype._read = function(/* bytes */) {
  // no-op, (flow-control doesn't really work on sound)
};


module.exports = MicrophoneStream;
