import { describe, expect, test } from "bun:test";
import { generateSlug } from "../slug";

describe("generateSlug", () => {
  test("returns a string matching pattern adjective-noun-number", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[a-z]+-[a-z]+-\d+$/);
  });

  test("number part is between 0 and 99", () => {
    for (let i = 0; i < 20; i++) {
      const slug = generateSlug();
      const parts = slug.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(99);
    }
  });

  test("returns different values on repeated calls (probabilistic)", () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 10; i++) {
      slugs.add(generateSlug());
    }
    // With 60*60*100 = 360,000 combinations, 10 calls should produce at least 2 unique
    expect(slugs.size).toBeGreaterThanOrEqual(2);
  });

  test("no two consecutive calls return the same slug (probabilistic)", () => {
    let prev = generateSlug();
    for (let i = 0; i < 5; i++) {
      const curr = generateSlug();
      expect(curr).not.toBe(prev);
      prev = curr;
    }
  });
});
