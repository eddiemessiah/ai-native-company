import { describe, expect, it } from "vitest";
import { brand, categories, chapters, offers, paidRoutes, sellable, tracks } from "../src/index";

describe("catalog", () => {
  it("has unique slugs and a known category for every offer", () => {
    const slugs = offers.map((o) => o.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const ids = new Set(categories.map((c) => c.id));
    for (const o of offers) expect(ids.has(o.category)).toBe(true);
  });

  it("fills in all eight pieces for every offer", () => {
    for (const o of offers) {
      expect(o.unit, o.slug).toBeTruthy();
      expect(o.intake.length, o.slug).toBeGreaterThan(0);
      expect(o.engine, o.slug).toBeTruthy();
      expect(o.rulebook.length, o.slug).toBeGreaterThanOrEqual(2);
      expect(o.review, o.slug).toBeTruthy();
      expect(o.delivery, o.slug).toBeTruthy();
      expect(o.price.label, o.slug).toBeTruthy();
      expect(o.distribution.length, o.slug).toBeGreaterThan(0);
      expect(o.pitch.length, o.slug).toBeGreaterThan(40);
    }
  });

  it("offers at least ten sellable solutions", () => {
    expect(offers.length).toBeGreaterThanOrEqual(20);
    expect(sellable.length).toBeGreaterThanOrEqual(10);
  });

  it("prices every paid route and keeps paths unique", () => {
    expect(paidRoutes.length).toBeGreaterThanOrEqual(5);
    for (const r of paidRoutes) {
      // The hosted facilitator charges ~$0.001 per settlement; below a cent a call nets nothing.
      expect(r.priceUsd, r.path).toBeGreaterThanOrEqual(0.01);
      expect(r.path.startsWith("/api/v1/")).toBe(true);
    }
    expect(new Set(paidRoutes.map((r) => r.path)).size).toBe(paidRoutes.length);
  });

  it("keeps the study group and brand data coherent", () => {
    expect(tracks.filter((t) => t.status === "open").map((t) => t.code)).toEqual(["T1", "T2"]);
    expect(chapters.some((c) => c.city === "Lagos" && c.status === "active")).toBe(true);
    expect(brand.name).toBeTruthy();
  });
});
