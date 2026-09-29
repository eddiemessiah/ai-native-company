#!/usr/bin/env python3
"""Transcribe a recording with word timestamps using faster-whisper (MIT).

Writes whisper-style JSON ({"language", "duration", "segments": [{"start", "end",
"text", "words": [{"word", "start", "end", "probability"}]}]}), which
`pnpm video ingest` reads. Progress goes to stderr.

    pip install faster-whisper
    python3 transcribe.py talk.mp4 talk.whisper.json --model large-v3-turbo --glossary "Celo, MiniPay, x402"

The glossary goes in as the initial prompt, which nudges Whisper towards the
right spelling of names and products. Captions still get checked by a person.
"""

import argparse
import json
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--model", default="large-v3-turbo", help="tiny, base, small, medium, large-v3, large-v3-turbo")
    parser.add_argument("--language", default=None, help="e.g. en; detected when left out")
    parser.add_argument("--glossary", default=None, help="names and products to spell right, comma separated")
    parser.add_argument("--device", default="auto", help="auto, cpu or cuda")
    parser.add_argument("--compute-type", default="default", help="e.g. int8 on CPU, float16 on GPU")
    args = parser.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("faster-whisper is not installed: pip install faster-whisper", file=sys.stderr)
        return 2

    model = WhisperModel(args.model, device=args.device, compute_type=args.compute_type)
    segments, info = model.transcribe(
        args.input,
        language=args.language,
        word_timestamps=True,
        vad_filter=True,
        initial_prompt=f"Glossary: {args.glossary}." if args.glossary else None,
    )

    out = {"language": info.language, "duration": info.duration, "segments": []}
    for segment in segments:
        out["segments"].append(
            {
                "start": segment.start,
                "end": segment.end,
                "text": segment.text,
                "words": [
                    {"word": w.word, "start": w.start, "end": w.end, "probability": w.probability}
                    for w in (segment.words or [])
                ],
            }
        )
        print(f"\r  {segment.end:8.1f}s of {info.duration:.1f}s", end="", file=sys.stderr, flush=True)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)
    print(f"\n  {len(out['segments'])} segments, language {info.language}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
