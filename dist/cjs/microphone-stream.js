"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var readable_stream_1 = require("readable-stream");
// some versions of the buffer browser lib don't support Buffer.from (such as the one included by the
// current version of express-browserify)
var buffer_from_1 = __importDefault(require("buffer-from"));
/**
 * Turns a MediaStream object (from getUserMedia) into a Node.js Readable stream
 * and optionally converts the audio to Buffers
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
 */
var MicrophoneStream = /** @class */ (function (_super) {
    __extends(MicrophoneStream, _super);
    /**
     * Turns a MediaStream object (from getUserMedia) into a Node.js Readable stream
     * and optionally converts the audio to Buffers
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
     *
     * @param {Object} [opts] options
     * @param {MediaStream} [opts.stream] https://developer.mozilla.org/en-US/docs/Web/API/MediaStream - for iOS compatibility, it is recommended that you create the MicrophoneStream instance in response to the tap - before you have a MediaStream, and then later call setStream() with the MediaStream.
     * @param {Boolean} [opts.objectMode=false] Puts the stream into ObjectMode where it emits AudioBuffers instead of Buffers - see https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
     * @param {Number|null} [opts.bufferSize=null] https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
     * @param {AudioContext} [opts.context] - AudioContext - will be automatically created if not passed in
     * @constructor
     */
    function MicrophoneStream(opts) {
        if (opts === void 0) { opts = { objectMode: false }; }
        var _this = _super.call(this, { objectMode: opts.objectMode }) || this;
        _this.audioInput = null;
        _this.recording = true;
        var stream = opts.stream, objectMode = opts.objectMode, bufferSize = opts.bufferSize, context = opts.context;
        _this.objectMode = objectMode;
        // "It is recommended for authors to not specify this buffer size and allow the implementation
        // to pick a good buffer size to balance between latency and audio quality."
        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
        // however, webkitAudioContext (safari) requires it to be set'
        // Possible values: null, 256, 512, 1024, 2048, 4096, 8192, 16384
        _this.bufferSize =
            bufferSize || typeof window.AudioContext === "undefined" ? 4096 : null;
        // @ts-expect-error Property 'webkitAudioContext' does not exist on type 'Window & typeof globalThis'
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        _this.context = context || new AudioContext();
        // We can only emit one channel's worth of audio, so only one input.
        // (Who has multiple microphones anyways?)
        var inputChannels = 1;
        // We shouldn't need any output channels (going back to the browser),
        // but chrome is buggy and won't give us any audio without one.
        var outputChannels = 1;
        _this.recorder = _this.context.createScriptProcessor(bufferSize, inputChannels, outputChannels);
        // Other half of workaround for chrome bugs.
        _this.recorder.connect(_this.context.destination);
        if (stream) {
            _this.setStream(stream);
        }
        setTimeout(function () {
            _this.emit("format", {
                channels: 1,
                bitDepth: 32,
                sampleRate: _this.context.sampleRate,
                signed: true,
                float: true,
            });
        }, 0);
        return _this;
    }
    /**
     * Sets the MediaStream.
     *
     * This was separated from the constructor to enable better compatibility with Safari on iOS 11.
     *
     * Typically the stream is only available asynchronously, but the context must be created or
     * resumed directly in response to a user's tap on iOS.
     *
     * @param {MediaStream} stream https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
     * @type {function(MediaStream): void}
     */
    MicrophoneStream.prototype.setStream = function (stream) {
        var _this = this;
        this.stream = stream;
        this.audioInput = this.context.createMediaStreamSource(stream);
        this.audioInput.connect(this.recorder);
        /**
         * Convert and emit the raw audio data
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode/onaudioprocess
         * @param {AudioProcessingEvent} e https://developer.mozilla.org/en-US/docs/Web/API/AudioProcessingEvent
         */
        var recorderProcess = function (e) {
            // onaudioprocess can be called at least once after we've stopped
            if (_this.recording) {
                _this.push(_this.objectMode
                    ? e.inputBuffer
                    : buffer_from_1.default(e.inputBuffer.getChannelData(0).buffer));
            }
        };
        this.recorder.onaudioprocess = recorderProcess;
    };
    /**
     * Temporarily stop emitting new data. Audio data recieved from the microphone
     * after this will be dropped.
     *
     * Note: the underlying Stream interface has a .pause() API that causes new data
     * to bebuffered rather than dropped.
     */
    MicrophoneStream.prototype.pauseRecording = function () {
        this.recording = false;
    };
    /**
     * Resume emitting new audio data after pauseRecording() was called.
     */
    MicrophoneStream.prototype.playRecording = function () {
        this.recording = true;
    };
    /**
     * Stops the recording.
     *
     * Note: Some versions of Firefox leave the recording icon in place after recording has stopped.
     */
    MicrophoneStream.prototype.stop = function () {
        if (this.context.state === "closed") {
            return;
        }
        try {
            this.stream.getTracks()[0].stop();
        }
        catch (ex) {
            // This fails in some older versions of chrome. Nothing we can do about it.
        }
        this.recorder.disconnect();
        if (this.audioInput) {
            this.audioInput.disconnect();
        }
        try {
            this.context.close(); // returns a promise;
        }
        catch (ex) {
            // this can also fail in older versions of chrome
        }
        this.recording = false;
        this.push(null);
        this.emit("close");
    };
    /**
     * no-op, (flow-control doesn't really work on live audio)
     */
    MicrophoneStream.prototype._read = function ( /* bytes */) {
        // no-op, (flow-control doesn't really work on live audio)
    };
    /**
     * Converts a Buffer back into the raw Float32Array format that browsers use.
     * Note: this is just a new DataView for the same underlying buffer -
     * the actual audio data is not copied or changed here.
     *
     * @memberof MicrophoneStream
     * @param {Buffer} chunk node-style buffer of audio data from a 'data' event or read() call
     * @return {Float32Array} raw 32-bit float data view of audio data
     */
    MicrophoneStream.toRaw = function (chunk) {
        return new Float32Array(chunk.buffer);
    };
    return MicrophoneStream;
}(readable_stream_1.Readable));
exports.default = MicrophoneStream;
