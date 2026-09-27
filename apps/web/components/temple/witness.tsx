import { BrainDemo } from "@/components/brain-demo";
import { TempleHead } from "./head";
import { Makimono } from "./makimono";

/** The decision log: describe a job and watch the brain route it, on a scroll. */
export function Witness({ names, apis }: { names: Record<string, string>; apis: readonly string[] }) {
  return (
    <section className="relative py-28 md:py-36" aria-labelledby="witness-title">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <TempleHead
            id="witness-title"
            kanji="証人"
            reading="shōnin · witness"
            eyebrow="Try it"
            title={
              <>
                Describe a job. <span className="serif text-dim">Watch it route.</span>
              </>
            }
            lede="Describe a job in a sentence. Shonin One picks the offer that fits, scores urgency and budget, and says what happens next. Every decision is written down with how sure it was, so a person can always read why."
          />
        </div>
        <div className="lg:col-span-7">
          <Makimono>
            <BrainDemo names={names} apis={apis} />
          </Makimono>
        </div>
      </div>
    </section>
  );
}
