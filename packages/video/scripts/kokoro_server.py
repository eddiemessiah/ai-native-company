#!/usr/bin/env python3
"""A local speech server for Kokoro-82M (Apache-2.0 weights) that speaks OpenAI's /v1/audio/speech contract.

The shorts pipeline's `local` voice calls it. Kokoro runs on a CPU at about real time, costs nothing per
character, and its weights allow client work (research/explainer-shorts.md §6c). It has American and British
English, French and other voices, but no Nigerian English: Azure's en-NG voices stay the default for those.

    pip install kokoro-onnx soundfile
    # kokoro-v1.0.int8.onnx and voices-v1.0.bin from
    # https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
    python3 kokoro_server.py --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin
    export LOCAL_TTS_URL=http://127.0.0.1:8880/v1 LOCAL_TTS_VOICE=af_heart

POST /v1/audio/speech  {"model": "kokoro", "voice": "af_heart", "input": "...", "response_format": "wav", "speed": 1}
GET  /v1/models, /v1/audio/voices, /health

It serves one engine and says so: any model other than "kokoro" is a 400, never a different engine. The voice's
first letter picks the language (a: American English, b: British English, f: French, ...). It listens on
127.0.0.1 unless told otherwise; set --key to require a Bearer token.
"""

import argparse
import io
import json
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

LANGUAGES = {"a": "en-us", "b": "en-gb", "e": "es", "f": "fr-fr", "h": "hi", "i": "it", "j": "ja", "p": "pt-br", "z": "cmn"}
MAX_INPUT = 4096


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", required=True, help="kokoro-v1.0.onnx or kokoro-v1.0.int8.onnx")
    parser.add_argument("--voices", required=True, help="voices-v1.0.bin")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8880)
    parser.add_argument("--key", default=None, help="require Authorization: Bearer <key>")
    args = parser.parse_args()

    try:
        import soundfile
        from kokoro_onnx import Kokoro
    except ImportError:
        print("kokoro-onnx is not installed: pip install kokoro-onnx soundfile", file=sys.stderr)
        return 2

    kokoro = Kokoro(args.model, args.voices)
    voices = set(kokoro.get_voices())
    lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def send_json(self, status: int, body: dict) -> None:
            data = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def error(self, status: int, message: str, code: str) -> None:
            self.send_json(status, {"error": {"message": message, "type": "invalid_request_error", "code": code}})

        def authorized(self) -> bool:
            if not args.key or self.headers.get("authorization") == f"Bearer {args.key}":
                return True
            self.error(401, "missing or wrong Bearer key", "unauthorized")
            return False

        def do_GET(self) -> None:
            if not self.authorized():
                return
            if self.path == "/health":
                self.send_json(200, {"status": "ok", "engine": "kokoro", "voices": len(voices)})
            elif self.path == "/v1/models":
                self.send_json(200, {"object": "list", "data": [{"id": "kokoro", "object": "model", "owned_by": "hexgrad (Apache-2.0)"}]})
            elif self.path == "/v1/audio/voices":
                self.send_json(200, {"voices": sorted(voices)})
            else:
                self.error(404, f"no route {self.path}", "not_found")

        def do_POST(self) -> None:
            if not self.authorized():
                return
            if self.path != "/v1/audio/speech":
                return self.error(404, f"no route {self.path}", "not_found")
            try:
                body = json.loads(self.rfile.read(int(self.headers.get("content-length") or 0)) or b"{}")
            except json.JSONDecodeError:
                return self.error(400, "the body is not JSON", "invalid_json")
            model, voice, text = body.get("model"), body.get("voice"), body.get("input")
            if model != "kokoro":
                return self.error(400, f'this server runs "kokoro" only, not "{model}"', "model_not_found")
            if voice not in voices:
                return self.error(400, f'unknown voice "{voice}"; GET /v1/audio/voices lists them', "voice_not_found")
            if not isinstance(text, str) or not text.strip() or len(text) > MAX_INPUT:
                return self.error(400, f"input must be 1 to {MAX_INPUT} characters", "invalid_input")
            if body.get("response_format", "wav") != "wav":
                return self.error(400, "only wav is served", "unsupported_format")
            speed = body.get("speed", 1.0)
            if not isinstance(speed, (int, float)) or not 0.5 <= speed <= 2.0:
                return self.error(400, "speed must be between 0.5 and 2", "invalid_speed")
            try:
                with lock:
                    samples, rate = kokoro.create(text, voice=voice, speed=float(speed), lang=LANGUAGES.get(voice[0], "en-us"))
                out = io.BytesIO()
                soundfile.write(out, samples, rate, format="WAV", subtype="PCM_16")
            except Exception as error:  # a failed synthesis is a 500, never an empty 200
                return self.send_json(500, {"error": {"message": str(error)[:300], "type": "server_error"}})
            data = out.getvalue()
            self.send_response(200)
            self.send_header("content-type", "audio/wav")
            self.send_header("content-length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, fmt: str, *values) -> None:
            print(f"kokoro_server: {fmt % values}", file=sys.stderr)

    print(f"Kokoro on http://{args.host}:{args.port}/v1 ({len(voices)} voices)", file=sys.stderr)
    HTTPServer((args.host, args.port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
