/** A spoken word and where it sits in the source, in seconds. */
export interface Word {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

export type TranscriptSource = "whisper" | "whisper-cpp" | "srt" | "vtt";

export interface Transcript {
  readonly source: TranscriptSource;
  /**
   * True when word times were spread across a caption cue by length instead of
   * measured. Cuts then get more padding, and filler removal is off.
   */
  readonly approximate: boolean;
  readonly language?: string;
  readonly words: readonly Word[];
}

/** A run of words that ends on a full stop, question mark, exclamation mark or a long pause. */
export interface Sentence {
  readonly index: number;
  /** First and last word, as indexes into the transcript's words (inclusive). */
  readonly first: number;
  readonly last: number;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export interface Interval {
  readonly start: number;
  readonly end: number;
}

export interface SourceInfo {
  readonly duration: number;
  /** Display size, after any rotation flag: phones store landscape pixels plus a rotate flag. */
  readonly width: number;
  readonly height: number;
  /** Frame rate as ffmpeg writes it, e.g. "30000/1001". */
  readonly fps: string;
  readonly hasAudio: boolean;
}

export type Format = "9x16" | "1x1" | "16x9";

/** crop: fill the frame from one region of the source. fit: the whole source over a blurred copy of itself. */
export type Mode = "crop" | "fit";
