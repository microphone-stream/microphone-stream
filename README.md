# microphone-stream

If you just want to get some audio through from your microphone, this is
what you're looking for!

Exposes an object stream, containing sound data (raw PCM) for as many
channels you want (mono, stereo, quad, etc) and nothing more!

```js
var getUserMedia = require('getusermedia');
var through2 = require('through2');
var micstream = require('microphone-stream');

getUserMedia({ video: false, audio: true }, function(err, stream) {
  micstream(stream).pipe(through2.obj(function(channels, enc, next) {
    // channels is an array of all the available channels
    // each channel is a Float32Array of length "bufferSize"
    var left = channels[0];
    var right = channels[1];

    // remember to call next() when you're using through2
    // and are ready for more data
    next();
  }));
});
```

## `micstream(stream, opts) -> Readable object stream`

Where `opts` is an option object, with defaults like this:
```js
{
  bufferSize: 4096,
  inputChannels: 2,   // explicitly sets no. of input channels
  outputChannels: 2,  // the same for output channels
  channels: 2         // set the no. of both input and output channels
}
```
