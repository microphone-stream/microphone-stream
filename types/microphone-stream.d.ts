/// <reference types="node" />
import { Readable } from "readable-stream";
export declare type MicrophoneStreamOptions = {
    /**
     * Represents a stream of media content. A stream consists of several tracks such as video or audio tracks.
     *
     * For iOS compatibility, it is recommended that you create the MicrophoneStream instance in response
     * to the tap - before you have a MediaStream, and then later call setStream() with the MediaStream.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
     */
    stream?: MediaStream;
    /**
     * Puts the stream into ObjectMode where it emits AudioBuffers instead of Buffers
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
     */
    objectMode: boolean;
    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
     */
    bufferSize?: number | null;
    /**
     * An audio-processing graph built from audio modules linked together, each represented by an AudioNode.
     */
    context?: AudioContext;
};
/**
 * Turns a MediaStream object (from getUserMedia) into a Node.js Readable stream
 * and optionally converts the audio to Buffers
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
 */
export default class MicrophoneStream extends Readable {
    context: AudioContext;
    audioInput: MediaStreamAudioSourceNode;
    private stream;
    private objectMode;
    private bufferSize;
    private recorder;
    private recording;
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
    constructor(opts?: MicrophoneStreamOptions);
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
    setStream(stream: MediaStream): void;
    /**
     * Temporarily stop emitting new data. Audio data recieved from the microphone
     * after this will be dropped.
     *
     * Note: the underlying Stream interface has a .pause() API that causes new data
     * to bebuffered rather than dropped.
     */
    pauseRecording(): void;
    /**
     * Resume emitting new audio data after pauseRecording() was called.
     */
    playRecording(): void;
    /**
     * Stops the recording.
     *
     * Note: Some versions of Firefox leave the recording icon in place after recording has stopped.
     */
    stop(): void;
    /**
     * no-op, (flow-control doesn't really work on live audio)
     */
    _read(): void;
    /**
     * Converts a Buffer back into the raw Float32Array format that browsers use.
     * Note: this is just a new DataView for the same underlying buffer -
     * the actual audio data is not copied or changed here.
     *
     * @memberof MicrophoneStream
     * @param {Buffer} chunk node-style buffer of audio data from a 'data' event or read() call
     * @return {Float32Array} raw 32-bit float data view of audio data
     */
    static toRaw(chunk: Buffer): Float32Array;
}
