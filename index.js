var through2 = require('through2');

var micstream = module.exports = function micstream(stream, opts) {
  var bufferSize = 4096, inputChannels = 2, outputChannels = 2;
  opts = opts || {};

  bufferSize = opts.bufferSize || bufferSize;

  if (opts.channels)
    inputChannels = outputChannels = opts.channels;

  inputChannels = opts.inputChannels || inputChannels;
  outputChannels = opts.outputChannels || outputChannels;

  var consumerStream = through2.obj();

  function recorderProcess(e) {
    var input = e.inputBuffer;
    var output = e.outputBuffer;

    var channels = [];
    for (var channel = 0; channel < input.numberOfChannels; channel++) {
      channels.push(input.getChannelData(channel));
    }

    consumerStream.write(channels);
  }

  var context = new window.AudioContext;
  var audioInput = context.createMediaStreamSource(stream);
  var recorder = context.createScriptProcessor(bufferSize, inputChannels, outputChannels);

  recorder.onaudioprocess = recorderProcess

  audioInput.connect(recorder);
  recorder.connect(context.destination);

  return consumerStream;
};
