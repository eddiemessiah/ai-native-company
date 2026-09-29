import { appendFileSync } from "node:fs";
import type { Brain, DecisionSink } from "@repo/brain";
import { decideClip, type ClipRoute } from "@repo/brain/recipes";
import type { Candidate } from "./candidates";
import type { Sentence } from "./types";

export interface ScoredCandidate {
  readonly candidate: Candidate;
  readonly route: ClipRoute;
  readonly decisionId: string;
  readonly provider: string;
  readonly model: string;
  readonly calibrated: boolean;
}

/** One JSON line per decision. The brain hashes the moment's words; they never reach the log. */
export function fileSink(path: string): DecisionSink {
  return {
    write(record) {
      appendFileSync(path, `${JSON.stringify(record)}\n`);
    },
  };
}

/**
 * Scores every candidate through the clip recipe, a few at a time. Five
 * failures in a row stop the run: that is an outage or a bad key, not bad luck.
 */
export async function scoreCandidates(
  brain: Brain,
  candidates: readonly Candidate[],
  sentences: readonly Sentence[],
  opts: {
    recording: string;
    job: string;
    concurrency?: number;
    minRank?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<{ scored: ScoredCandidate[]; failed: number }> {
  const results: (ScoredCandidate | undefined)[] = new Array(candidates.length);
  let next = 0;
  let done = 0;
  let failed = 0;
  let streak = 0;
  let stop: Error | undefined;

  async function worker(): Promise<void> {
    while (next < candidates.length && !stop) {
      const i = next++;
      const c = candidates[i]!;
      try {
        const { decision, route } = await decideClip(
          brain,
          {
            recording: opts.recording,
            previous: sentences[c.first - 1]?.text ?? "(the recording starts here)",
            moment: c.text,
          },
          {
            ...(opts.minRank === undefined ? {} : { minRank: opts.minRank }),
            meta: { job: opts.job, candidate: c.id, start: c.start, end: c.end },
          },
        );
        results[i] = {
          candidate: c,
          route,
          decisionId: decision.id,
          provider: decision.provider,
          model: decision.model,
          calibrated: decision.calibrated,
        };
        streak = 0;
      } catch (error) {
        failed++;
        streak++;
        if (streak >= 5) {
          stop = new Error(`Stopped after 5 failed decisions in a row: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      done++;
      opts.onProgress?.(done, candidates.length);
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, Math.min(opts.concurrency ?? 6, candidates.length)) }, worker));
  if (stop) throw stop;
  return { scored: results.filter((r): r is ScoredCandidate => r !== undefined), failed };
}
