// AudioWorkletProcessor implementing a simple granular pitch shifter.
//
// Two overlapping "grains" read from a circular history buffer at a rate
// of `pitchRatio` samples per output sample (reading faster raises pitch,
// slower lowers it). Each grain is windowed with a Hann function and the
// grains are offset by half a grain so their windows crossfade smoothly;
// a 50%-overlapped Hann pair sums to a constant 1.0, so no extra gain
// normalization is needed. Grains restart every GRAIN_SIZE samples,
// re-anchoring to the current write position so playback never drifts
// into unwritten (future) audio for the pitch range this extension uses
// (roughly 0.5x-2x, i.e. +/-1 octave).

const GRAIN_SIZE = 4096;

class PitchShiftProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = GRAIN_SIZE * 2;
    this.buffer = new Float32Array(this.bufferSize);
    this.writePos = 0;
    this.filled = 0;
    this.pitchRatio = 1.0;

    this.window = new Float32Array(GRAIN_SIZE);
    for (let i = 0; i < GRAIN_SIZE; i++) {
      this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / GRAIN_SIZE);
    }

    this.grains = [
      { readPos: 0, phase: 0 },
      { readPos: 0, phase: GRAIN_SIZE / 2 },
    ];

    this.port.onmessage = (event) => {
      if (typeof event.data.pitchRatio === 'number') {
        this.pitchRatio = event.data.pitchRatio;
      }
    };
  }

  readInterpolated(pos) {
    const n = this.bufferSize;
    const wrapped = ((pos % n) + n) % n;
    const i0 = Math.floor(wrapped);
    const i1 = (i0 + 1) % n;
    const frac = wrapped - i0;
    return this.buffer[i0] * (1 - frac) + this.buffer[i1] * frac;
  }

  process(inputs, outputs) {
    const input = inputs[0][0];
    const output = outputs[0][0];
    if (!input || !output) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.writePos] = input[i];
      this.filled = Math.min(this.filled + 1, this.bufferSize);

      let sample = 0;
      for (const grain of this.grains) {
        if (grain.phase >= GRAIN_SIZE) {
          grain.phase = 0;
          grain.readPos = this.writePos - GRAIN_SIZE;
        }
        sample += this.readInterpolated(grain.readPos) * this.window[grain.phase];
        grain.readPos += this.pitchRatio;
        grain.phase += 1;
      }

      output[i] = this.filled >= GRAIN_SIZE ? sample : input[i];
      this.writePos = (this.writePos + 1) % this.bufferSize;
    }

    return true;
  }
}

registerProcessor('pitch-shift-processor', PitchShiftProcessor);
