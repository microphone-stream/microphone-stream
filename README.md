# microphone-stream

If you just want to get some audio through from your microphone, this is
what you're looking for!

Converts a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream), containing sound data (from [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia), into a standard Node.js-style stream for easy `pipe()`'ing.

Note: this module is intended for use in browsers (presumably with with [browserify](http://browserify.org/)), 
it does not work in Node.js

Additionally, this only works in a limited set of browsers, see http://caniuse.com/#search=getusermedia for details.


### Example

```js
var getUserMedia = require('getusermedia');
var MicrophoneStream = require('microphone-stream');

getUserMedia({ video: false, audio: true }, function(err, stream) {
  var micStream = new MicrophoneStream(stream);
  
    // get raw audio (Float32Array, all values are between 1 and -1)
    micStream.on('raw', function(data) {
      //...
    });
    
    // get Buffers (Essentially a Uint8Array view of the same Float32 values)
    micStream.on('data', function(chunk) {
      // Optionally convert the Buffer back into a Float32Array
      // (This actually just creates a new DataView - the underlying audio data is not copied or modified.)
      var raw = MicrophoneStream.toRaw(chunk) 
      
      //...
     });
    
    
    // or pipe it to another stream
    micStream.pipe(wherever);
    
    //  also emits a format event with various details (frequency, channels, etc)
    micStream.on('format', function(format) {
      console.log(format);
    });
    
  }));
});
```

## `micstream(stream, opts) -> Readable Stream`

Where `opts` is an option object, with defaults like this:
```js
{
  bufferSize: null, // Possible values: null, 256, 512, 1024, 2048, 4096, 8192, 16384
}
```

"It is recommended for authors to not specify this buffer size and allow the implementation to pick a good buffer size 
to balance between latency and audio quality."
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
  
