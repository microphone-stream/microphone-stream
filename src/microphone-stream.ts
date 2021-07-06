import { Readable } from "readable-stream";
// some versions of the buffer browser lib don't support Buffer.from (such as the one included by the
// current version of express-browserify)
import bufferFrom from "buffer-from";

export type MicrophoneStreamOptions = {
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
  public context: AudioContext;
  public audioInput: MediaStreamAudioSourceNode = null;
  private stream: MediaStream;
  private objectMode: boolean;
  private bufferSize: number;
  private recorder: ScriptProcessorNode;
  private recording = true;

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
  constructor(opts: MicrophoneStreamOptions = { objectMode: false }) {
    super({ objectMode: opts.objectMode });
    const { stream, objectMode, bufferSize, context } = opts;

    this.objectMode = objectMode;

    // "It is recommended for authors to not specify this buffer size and allow the implementation
    // to pick a good buffer size to balance between latency and audio quality."
    // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createScriptProcessor
    // however, webkitAudioContext (safari) requires it to be set'
    // Possible values: null, 256, 512, 1024, 2048, 4096, 8192, 16384
    this.bufferSize =
      bufferSize || typeof window.AudioContext === "undefined" ? 4096 : null;

    // @ts-expect-error Property 'webkitAudioContext' does not exist on type 'Window & typeof globalThis'
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = context || new AudioContext();

    // We can only emit one channel's worth of audio, so only one input.
    // (Who has multiple microphones anyways?)
    const inputChannels = 1;

    // We shouldn't need any output channels (going back to the browser),
    // but chrome is buggy and won't give us any audio without one.
    const outputChannels = 1;

    this.recorder = this.context.createScriptProcessor(
      bufferSize,
      inputChannels,
      outputChannels
    );

    // Other half of workaround for chrome bugs.
    this.recorder.connect(this.context.destination);

    if (stream) {
      this.setStream(stream);
    }

    setTimeout(() => {
      this.emit("format", {
        channels: 1,
        bitDepth: 32,
        sampleRate: this.context.sampleRate,
        signed: true,
        float: true,
      });
    }, 0);
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
  public setStream(stream: MediaStream): void {
    this.stream = stream;
    this.audioInput = this.context.createMediaStreamSource(stream);
    this.audioInput.connect(this.recorder);

    /**
     * Convert and emit the raw audio data
     * @see https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode/onaudioprocess
     * @param {AudioProcessingEvent} e https://developer.mozilla.org/en-US/docs/Web/API/AudioProcessingEvent
     */
    const recorderProcess = (e: AudioProcessingEvent) => {
      // onaudioprocess can be called at least once after we've stopped
      if (this.recording) {
        this.push(
          this.objectMode
            ? e.inputBuffer
            : bufferFrom(e.inputBuffer.getChannelData(0).buffer)
        );
      }
    };
    this.recorder.onaudioprocess = recorderProcess;
  }

  /**
   * Temporarily stop emitting new data. Audio data recieved from the microphone
   * after this will be dropped.
   *
   * Note: the underlying Stream interface has a .pause() API that causes new data
   * to bebuffered rather than dropped.
   */
  public pauseRecording(): void {
    this.recording = false;
  }

  /**
   * Resume emitting new audio data after pauseRecording() was called.
   */
  public playRecording(): void {
    this.recording = true;
  }

  /**
   * Stops the recording.
   *
   * Note: Some versions of Firefox leave the recording icon in place after recording has stopped.
   */
  public stop(): void {
    if (this.context.state === "closed") {
      return;
    }
    try {
      this.stream.getTracks()[0].stop();
    } catch (ex) {
      // This fails in some older versions of chrome. Nothing we can do about it.
    }
    this.recorder.disconnect();
    if (this.audioInput) {
      this.audioInput.disconnect();
    }
    try {
      this.context.close(); // returns a promise;
    } catch (ex) {
      // this can also fail in older versions of chrome
    }
    this.recording = false;
    this.push(null);
    this.emit("close");
  }

  /**
   * no-op, (flow-control doesn't really work on live audio)
   */
  public _read(/* bytes */): void {
    // no-op, (flow-control doesn't really work on live audio)
  }

  /**
   * Converts a Buffer back into the raw Float32Array format that browsers use.
   * Note: this is just a new DataView for the same underlying buffer -
   * the actual audio data is not copied or changed here.
   *
   * @memberof MicrophoneStream
   * @param {Buffer} chunk node-style buffer of audio data from a 'data' event or read() call
   * @return {Float32Array} raw 32-bit float data view of audio data
   */
  public static toRaw(chunk: Buffer): Float32Array {
    return new Float32Array(chunk.buffer);
  }
}
