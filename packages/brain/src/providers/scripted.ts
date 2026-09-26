import type { AnswersFor, DecisionProvider, ProviderRequest, ProviderResult, QuestionSet } from "../types";

/**
 * A provider whose answers come from a function. For tests, replaying logged
 * decisions, and simulating outages (throw from the function).
 */
export class ScriptedProvider implements DecisionProvider {
  constructor(
    private readonly script: (req: ProviderRequest<QuestionSet>) => Record<string, unknown> | Promise<Record<string, unknown>>,
    readonly name = "scripted",
    readonly calibrated = true,
    private readonly model = "scripted-1",
  ) {}

  async decide<Qs extends QuestionSet>(req: ProviderRequest<Qs>): Promise<ProviderResult<Qs>> {
    const answers = await this.script(req);
    return { answers: answers as AnswersFor<Qs>, model: this.model };
  }
}
