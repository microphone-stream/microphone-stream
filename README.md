# Node-style stream for getUserMedia

[![Build Status](https://travis-ci.org/saebekassebil/microphone-stream.svg?branch=master)](https://travis-ci.org/saebekassebil/microphone-stream)

If you just want to get some audio data from your microphone, this is what you're looking for!

Converts a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) (from [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia)) into a standard Node.js-style stream for easy `pipe()`ing.

Note: This only works in a [limited set of browsers](http://caniuse.com/#search=getusermedia)
(typically with with [webpack](http://webpack.github.io/) or [browserify](http://browserify.org/)),
and then only for [https or localhost in Chrome](https://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features).
It does not work in Node.js.


### Example

```js
var getUserMedia = require('get-user-media-promise');
var MicrophoneStream = require('microphone-stream');

getUserMedia({ video: false, audio: true })
  .then(function(stream) {
    var micStream = new MicrophoneStream(stream);

    // get Buffers (Essentially a Uint8Array DataView of the same Float32 values)
    micStream.on('data', function(chunk) {
      // Optionally convert the Buffer back into a Float32Array
      // (This actually just creates a new DataView - the underlying audio data is not copied or modified.)
      var raw = MicrophoneStream.toRaw(chunk)
      //...

      // note: if you set options.objectMode=true, the `data` event will output AudioBuffers instead of Buffers
     });

    // or pipe it to another stream
    micStream.pipe(/*...*/);

    // It also emits a format event with various details (frequency, channels, etc)
    micStream.on('format', function(format) {
      console.log(format);
    });

    // Stop when ready
    document.getElementById('my-stop-button').onclick = function() {
      micStream.stop();
    };
  }).catch(function(error) {
    console.log(error);
  });
```

## `API`

### `new MicrophoneStream(stream, opts)` -> [Readable Stream](https://nodejs.org/api/stream.html)

Where `opts` is an option object, with defaults:
```js
{
  objectMode: false,
  bufferSize: null
}
```

* **bufferSize**: Possible values: null, 256, 512, 1024, 2048, 4096, 8192, 16384. From [Mozilla's Docs](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor):
 > It is recommended for authors to not specify this buffer size and allow the implementation to pick a good buffer size 
 > to balance between latency and audio quality.
  
* **objectMode**: if true, stream enters [objectMode] and emits AudioBuffers instead of Buffers. This has implications for `pipe()`'ing to other streams.

#### `.stop()` 

Stops the recording. 
Note: Some versions of Firefox leave the recording icon in place after recording has stopped.

#### Event: `data`

Emits either a [Buffer] with raw 32-bit Floating point audio data, or if [objectMode] is set, an [AudioBuffer] containing the data + some metadata.

#### Event: `format`

One-time event with details of the audio format. Example:

```js
{
  channels: 1,
  bitDepth: 32,
  sampleRate: 48000,
  signed: true,
  float: true
}
```

## `MicrophoneStream.toRaw(Buffer) -> Float32Array`
  
Converts a `Buffer` (from a `data` event or from calling `.read()`) back to the original Float32Array DataView format. (The underlying audio data is not copied or modified.)

[AudioBuffer]: https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
[Buffer]: https://nodejs.org/api/buffer.html
[objectMode]: https://nodejs.org/api/stream.html#stream_object_mode
