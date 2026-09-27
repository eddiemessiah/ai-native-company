import { writeFile } from "node:fs/promises";
import { platform } from "node:os";
import { run } from "../ffmpeg";

export type VoiceProvider = "edge" | "openai" | "say" | "pico" | "espeak";

export interface VoiceSpec {
  readonly provider: VoiceProvider;
  readonly voice: string;
}

/**
 * edge: Microsoft's neural voices through the edge-tts package (free, online), including the Nigerian English
 *       voices en-NG-EzinneNeural and en-NG-AbeoNeural. Check the research note on terms before client work.
 * openai: OpenAI's speech API (OPENAI_API_KEY). say: macOS's built-in voices.
 * pico and espeak: offline and robotic; for drafts and tests only.
 */
export const DEFAULT_VOICES: Readonly<Record<VoiceProvider, string>> = {
  edge: "en-NG-EzinneNeural",
  openai: "coral",
  say: "Samantha",
  pico: "en-GB",
  espeak: "en-us",
};

/** "edge:en-NG-AbeoNeural", "openai:ash", "pico" */
export function parseVoice(value: string): VoiceSpec {
  const [provider = "", ...rest] = value.split(":");
  if (!(provider in DEFAULT_VOICES)) throw new Error(`Unknown voice "${value}": use edge, openai, say, pico or espeak, optionally with :<voice>`);
  const p = provider as VoiceProvider;
  return { provider: p, voice: rest.join(":") || DEFAULT_VOICES[p] };
}

/** The file extension each provider writes before we normalize it. */
export const RAW_EXTENSION: Readonly<Record<VoiceProvider, string>> = {
  edge: "mp3",
  openai: "wav",
  say: "aiff",
  pico: "wav",
  espeak: "wav",
};

/** The command a command-line provider runs, or null for an API provider. Pure, so tests can check it. */
export function voiceCommand(spec: VoiceSpec, text: string, out: string): { cmd: string; args: string[] } | null {
  switch (spec.provider) {
    case "edge":
      return { cmd: "edge-tts", args: ["--voice", spec.voice, "--text", text, "--write-media", out] };
    case "say":
      return { cmd: "say", args: ["-v", spec.voice, "-o", out, text] };
    case "pico":
      return { cmd: "pico2wave", args: ["-l", spec.voice, "-w", out, text] };
    case "espeak":
      return { cmd: "espeak-ng", args: ["-v", spec.voice, "-s", "165", "-w", out, text] };
    case "openai":
      return null;
  }
}

async function has(cmd: string): Promise<boolean> {
  try {
    await run("sh", ["-c", `command -v ${cmd}`]);
    return true;
  } catch {
    return false;
  }
}

/** The best voice this machine can use without a key: edge-tts, then macOS say, then Pico, then espeak. */
export async function autoVoice(): Promise<VoiceSpec> {
  if (await has("edge-tts")) return parseVoice("edge");
  if (platform() === "darwin") return parseVoice("say");
  if (await has("pico2wave")) return parseVoice("pico");
  return parseVoice("espeak");
}

async function openaiSpeech(spec: VoiceSpec, text: string, out: string, env: NodeJS.ProcessEnv): Promise<void> {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("The openai voice needs OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: spec.voice,
      input: text,
      response_format: "wav",
      instructions: "A clear, warm explainer for builders. Steady pace, no hype.",
    }),
  });
  if (!res.ok) throw new Error(`OpenAI speech returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  await writeFile(out, Buffer.from(await res.arrayBuffer()));
}

/** Seconds of audio in a file. */
export async function audioDuration(file: string): Promise<number> {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  const seconds = Number(stdout.trim());
  if (!Number.isFinite(seconds)) throw new Error(`Could not read the length of ${file}`);
  return seconds;
}

/** Trims the silence a voice leaves at each end, then 48 kHz mono PCM so every beat joins cleanly. */
export function tidyArgs(input: string, out: string): string[] {
  const trim = "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-50dB";
  return ["-hide_banner", "-loglevel", "error", "-y", "-i", input, "-af", `${trim},areverse,${trim},areverse,aresample=48000`, "-ac", "1", "-c:a", "pcm_s16le", out];
}

/** Voices one beat into `<dir>/<name>.wav` and returns its length. */
export async function speak(spec: VoiceSpec, text: string, dir: string, name: string, env: NodeJS.ProcessEnv = process.env) {
  const raw = `${dir}/${name}.raw.${RAW_EXTENSION[spec.provider]}`;
  const command = voiceCommand(spec, text, raw);
  if (command) await run(command.cmd, command.args);
  else await openaiSpeech(spec, text, raw, env);
  const file = `${dir}/${name}.wav`;
  await run("ffmpeg", tidyArgs(raw, file));
  return { file, duration: await audioDuration(file) };
}
