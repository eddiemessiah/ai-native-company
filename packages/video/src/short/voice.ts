import { writeFile } from "node:fs/promises";
import { platform } from "node:os";
import { run } from "../ffmpeg";

export type VoiceProvider = "azure" | "local" | "openai" | "elevenlabs" | "edge" | "say" | "pico" | "espeak";

export interface VoiceSpec {
  readonly provider: VoiceProvider;
  readonly voice: string;
}

/**
 * azure: Azure AI Speech, the default for published work. Nigerian English neural voices (en-NG-EzinneNeural,
 *        en-NG-AbeoNeural) under a paid commercial contract (AZURE_SPEECH_KEY, AZURE_SPEECH_REGION).
 * local: an OpenAI-compatible speech server you run: our Kokoro server (scripts/kokoro_server.py) or VoiceStudio.
 *        LOCAL_TTS_URL, and optionally LOCAL_TTS_MODEL (the engine id), LOCAL_TTS_VOICE and LOCAL_TTS_KEY. Whether the
 *        engine may publish comes from LOCAL_ENGINES below, never from the environment.
 * openai: OpenAI's speech API (OPENAI_API_KEY). elevenlabs: a voice id from your library (ELEVENLABS_API_KEY),
 *        publishable on a paid plan (ELEVENLABS_PLAN).
 * edge: the edge-tts package, which imitates Edge's read-aloud client; its maintainer says it's for personal use.
 * say: macOS voices. pico and espeak: offline and robotic. edge, say, pico and espeak are for drafts only.
 * The terms behind each are in research/explainer-shorts.md §6.
 */
export const DEFAULT_VOICES: Readonly<Record<VoiceProvider, string>> = {
  azure: "en-NG-EzinneNeural",
  local: "af_heart",
  openai: "coral",
  elevenlabs: "",
  edge: "en-NG-EzinneNeural",
  say: "Samantha",
  pico: "en-GB",
  espeak: "en-us",
};

/** "azure:en-NG-AbeoNeural", "openai:ash", "local:bf_emma", "pico" */
export function parseVoice(value: string): VoiceSpec {
  const [provider = "", ...rest] = value.split(":");
  if (!(provider in DEFAULT_VOICES)) {
    throw new Error(`Unknown voice "${value}": use azure, local, openai, elevenlabs, edge, say, pico or espeak, optionally with :<voice>`);
  }
  const p = provider as VoiceProvider;
  const voice = rest.join(":") || DEFAULT_VOICES[p];
  if (!voice) throw new Error(`${p} needs a voice id: --voice ${p}:<voice id>`);
  return { provider: p, voice };
}

export interface VoiceLicence {
  /**
   * publish: may ship in a published short. draft: for review and tests; approval refuses it.
   * never: non-commercial weights, not even for a paid job's drafts; render refuses it.
   */
  readonly use: "publish" | "draft" | "never";
  /** What the job ledger records: the licence or plan the voice is used under. */
  readonly licence: string;
  readonly note?: string;
  /** A credit the licence asks for, carried into the publish packet. */
  readonly credit?: string;
}

export interface LocalEngine {
  readonly weights: string;
  readonly use: "publish" | "never";
  /** It can clone a voice from reference audio, so a voice that isn't a preset needs a release (voices.ts). */
  readonly clones: boolean;
  readonly credit?: string;
}

/**
 * Engines a local speech server may run, keyed by the engine id sent as the model (LOCAL_TTS_MODEL), and what their
 * weights allow (research/voicestudio.md §3; research/explainer-shorts.md §6c). A licence decision is code that a
 * person reviews in a pull request, never an environment variable. Anything missing here is a draft voice.
 */
export const LOCAL_ENGINES: Readonly<Record<string, LocalEngine>> = {
  kokoro: { weights: "Kokoro-82M, Apache-2.0", use: "publish", clones: false },
  kittentts: { weights: "KittenTTS, Apache-2.0", use: "publish", clones: false },
  voxcpm2: { weights: "VoxCPM2, Apache-2.0", use: "publish", clones: true },
  "moss-tts-v15": { weights: "MOSS-TTS v1.5, Apache-2.0", use: "publish", clones: true },
  "moss-tts-nano": { weights: "MOSS-TTS-Nano, Apache-2.0", use: "publish", clones: true },
  cosyvoice: { weights: "Fun-CosyVoice 3, Apache-2.0", use: "publish", clones: true },
  "confucius4-tts": { weights: "Confucius4-TTS, Apache-2.0", use: "publish", clones: true },
  "dots-tts": { weights: "dots.tts, Apache-2.0", use: "publish", clones: true },
  pockettts: { weights: "Pocket TTS by Kyutai, CC-BY-4.0", use: "publish", clones: true, credit: "Voice: Pocket TTS by Kyutai (CC-BY-4.0)" },
  omnivoice: { weights: "OmniVoice, CC-BY-NC", use: "never", clones: true },
  "omnivoice-gguf": { weights: "OmniVoice GGUF, CC-BY-NC-4.0", use: "never", clones: true },
  "omnivoice-subprocess": { weights: "OmniVoice, CC-BY-NC", use: "never", clones: true },
  audiocpp: { weights: "Breeze-TTS-2, a research and non-commercial licence", use: "never", clones: true },
};

/** The engine a local server runs for us: the model id we send. */
export const localEngineId = (env: NodeJS.ProcessEnv) => env.LOCAL_TTS_MODEL?.trim() || "kokoro";

/** Whether a voice may ship, from its provider and the licence or plan declared in the environment. */
export function voiceLicence(spec: VoiceSpec, env: NodeJS.ProcessEnv = process.env): VoiceLicence {
  switch (spec.provider) {
    case "azure":
      return { use: "publish", licence: "Azure AI Speech, paid service terms" };
    case "openai":
      return { use: "publish", licence: "OpenAI API terms", note: "OpenAI requires telling listeners the voice is AI; the post does" };
    case "elevenlabs": {
      const plan = env.ELEVENLABS_PLAN?.trim();
      if (plan && !/^free$/i.test(plan)) return { use: "publish", licence: `ElevenLabs ${plan} plan` };
      return {
        use: "draft",
        licence: plan ? "ElevenLabs Free" : "ElevenLabs, plan not declared",
        note: "only paid plans include a commercial licence: set ELEVENLABS_PLAN to yours",
      };
    }
    case "local": {
      const id = localEngineId(env);
      const engine = LOCAL_ENGINES[id];
      if (!engine) {
        return {
          use: "draft",
          licence: `${id}: not in the engine allowlist`,
          note: /^(tts-1|tts-1-hd|gpt-4o-mini-tts)/.test(id)
            ? "OpenAI model names run whatever engine the server has active: send an engine id such as voxcpm2"
            : "add the engine to LOCAL_ENGINES with its weights licence, through a pull request",
        };
      }
      if (engine.use === "never") return { use: "never", licence: engine.weights, note: "non-commercial weights: not for client work, or a paid job's drafts" };
      return { use: "publish", licence: engine.weights, ...(engine.credit ? { credit: engine.credit } : {}) };
    }
    case "edge":
      return { use: "draft", licence: "none: an unofficial client of Edge's read-aloud service", note: "its maintainer says it's for personal use; azure sells the same voices" };
    case "say":
      return { use: "draft", licence: "none on record", note: "macOS system voices are for drafts" };
    case "pico":
      return { use: "draft", licence: "SVOX Pico, Apache-2.0", note: "robotic: drafts and tests only" };
    case "espeak":
      return { use: "draft", licence: "eSpeak NG, GPL-3.0", note: "robotic: drafts and tests only" };
  }
}

/** The file extension each provider writes before we normalize it. */
export const RAW_EXTENSION: Readonly<Record<VoiceProvider, string>> = {
  azure: "wav",
  local: "wav",
  openai: "wav",
  elevenlabs: "mp3",
  edge: "mp3",
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
    case "local":
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

/**
 * The best voice this machine can use: a licensed one when its key is set (Azure, then your own server, then OpenAI),
 * else a draft voice (macOS say, Pico, espeak). Never edge-tts: name it with --voice edge for a draft if you must.
 */
export async function autoVoice(
  env: NodeJS.ProcessEnv = process.env,
  probe: (cmd: string) => Promise<boolean> = has,
  os: string = platform(),
): Promise<VoiceSpec> {
  if (env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION) return parseVoice("azure");
  if (env.LOCAL_TTS_URL) return parseVoice(env.LOCAL_TTS_VOICE ? `local:${env.LOCAL_TTS_VOICE}` : "local");
  if (env.OPENAI_API_KEY) return parseVoice("openai");
  if (os === "darwin") return parseVoice("say");
  if (await probe("pico2wave")) return parseVoice("pico");
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
    case "local":
      // The OpenAI speech contract, which Kokoro-FastAPI and most self-hosted servers speak. LOCAL_TTS_URL ends in /v1.
      return {
        url: `${need("LOCAL_TTS_URL").replace(/\/+$/, "")}/audio/speech`,
        init: {
          method: "POST",
          headers: { ...(env.LOCAL_TTS_KEY ? { authorization: `Bearer ${env.LOCAL_TTS_KEY}` } : {}), "content-type": "application/json" },
          body: JSON.stringify({ model: localEngineId(env), voice: spec.voice, input: text, response_format: "wav" }),
        },
      };
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
