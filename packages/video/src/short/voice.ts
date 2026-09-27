import { writeFile } from "node:fs/promises";
import { platform } from "node:os";
import { run } from "../ffmpeg";

export type VoiceProvider = "edge" | "azure" | "openai" | "elevenlabs" | "say" | "pico" | "espeak";

export interface VoiceSpec {
  readonly provider: VoiceProvider;
  readonly voice: string;
}

/**
 * edge: Microsoft's neural voices through the edge-tts package (free, online), including the Nigerian English
 *       voices en-NG-EzinneNeural and en-NG-AbeoNeural. Not an official API: our own channel and drafts only.
 * azure: the same voices through Azure AI Speech, the licensed route for client work (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION).
 * openai: OpenAI's speech API (OPENAI_API_KEY). elevenlabs: a voice id from your ElevenLabs library (ELEVENLABS_API_KEY).
 * say: macOS's built-in voices. pico and espeak: offline and robotic; for drafts and tests only.
 */
export const DEFAULT_VOICES: Readonly<Record<VoiceProvider, string>> = {
  edge: "en-NG-EzinneNeural",
  azure: "en-NG-EzinneNeural",
  openai: "coral",
  elevenlabs: "",
  say: "Samantha",
  pico: "en-GB",
  espeak: "en-us",
};

/** "edge:en-NG-AbeoNeural", "openai:ash", "pico" */
export function parseVoice(value: string): VoiceSpec {
  const [provider = "", ...rest] = value.split(":");
  if (!(provider in DEFAULT_VOICES)) {
    throw new Error(`Unknown voice "${value}": use edge, azure, openai, elevenlabs, say, pico or espeak, optionally with :<voice>`);
  }
  const p = provider as VoiceProvider;
  const voice = rest.join(":") || DEFAULT_VOICES[p];
  if (!voice) throw new Error(`${p} needs a voice id: --voice ${p}:<voice id>`);
  return { provider: p, voice };
}

/** The file extension each provider writes before we normalize it. */
export const RAW_EXTENSION: Readonly<Record<VoiceProvider, string>> = {
  edge: "mp3",
  azure: "wav",
  openai: "wav",
  elevenlabs: "mp3",
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
    case "azure":
    case "openai":
    case "elevenlabs":
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

const xml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** The HTTP request an API provider needs. Pure, so tests can check it without a network. */
export function speechRequest(spec: VoiceSpec, text: string, env: NodeJS.ProcessEnv): { url: string; init: RequestInit } {
  const need = (name: string) => {
    const value = env[name];
    if (!value) throw new Error(`The ${spec.provider} voice needs ${name}`);
    return value;
  };
  switch (spec.provider) {
    case "azure": {
      const lang = /^[a-z]{2}-[A-Z]{2}/.exec(spec.voice)?.[0] ?? "en-US";
      return {
        url: `https://${need("AZURE_SPEECH_REGION")}.tts.speech.microsoft.com/cognitiveservices/v1`,
        init: {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": need("AZURE_SPEECH_KEY"),
            "content-type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "riff-48khz-16bit-mono-pcm",
          },
          body: `<speak version="1.0" xml:lang="${lang}"><voice name="${xml(spec.voice)}">${xml(text)}</voice></speak>`,
        },
      };
    }
    case "openai":
      return {
        url: "https://api.openai.com/v1/audio/speech",
        init: {
          method: "POST",
          headers: { authorization: `Bearer ${need("OPENAI_API_KEY")}`, "content-type": "application/json" },
          body: JSON.stringify({
            model: env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
            voice: spec.voice,
            input: text,
            response_format: "wav",
            instructions: "A clear, warm explainer for builders. Steady pace, no hype.",
          }),
        },
      };
    case "elevenlabs":
      return {
        url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(spec.voice)}?output_format=mp3_44100_128`,
        init: {
          method: "POST",
          headers: { "xi-api-key": need("ELEVENLABS_API_KEY"), "content-type": "application/json" },
          body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2" }),
        },
      };
    default:
      throw new Error(`${spec.provider} is not an API voice`);
  }
}

async function apiSpeech(spec: VoiceSpec, text: string, out: string, env: NodeJS.ProcessEnv): Promise<void> {
  const { url, init } = speechRequest(spec, text, env);
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${spec.provider} speech returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
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
  else await apiSpeech(spec, text, raw, env);
  const file = `${dir}/${name}.wav`;
  await run("ffmpeg", tidyArgs(raw, file));
  return { file, duration: await audioDuration(file) };
}
