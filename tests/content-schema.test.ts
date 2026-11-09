import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { faqInputSchema } from "../src/lib/content-schema.ts";
import { newsInputSchema } from "../src/lib/content-schema.ts";

test("an FAQ question and answer cannot be blank", () => {
  // The public page already filters blank questions out, which hides the bug
  // instead of preventing it: an admin could save an empty FAQ and the row
  // would exist but never render.
  assert.equal(faqInputSchema.safeParse({ question: "   ", answer: "a" }).success, false);
  assert.equal(faqInputSchema.safeParse({ question: "q", answer: "   " }).success, false);
});

test("an FAQ accepts ordinary content", () => {
  const parsed = faqInputSchema.safeParse({
    question: "Bagaimana cara mendaftar?",
    answer: "Isi formulir RSVP di halaman jadwal.",
  });
  assert.equal(parsed.success, true);
});

test("FAQ text is bounded so one row cannot hold an unbounded blob", () => {
  assert.equal(
    faqInputSchema.safeParse({ question: "q".repeat(500), answer: "a" }).success,
    false
  );
  assert.equal(
    faqInputSchema.safeParse({ question: "q", answer: "a".repeat(5000) }).success,
    false
  );
});

test("news content and excerpt are bounded", () => {
  assert.equal(newsInputSchema.safeParse({ content: "c".repeat(100_001), excerpt: "" }).success, false);
  assert.equal(newsInputSchema.safeParse({ content: "c", excerpt: "e".repeat(501) }).success, false);
  assert.equal(newsInputSchema.safeParse({ content: "c", excerpt: "" }).success, true);
});

test("the shared text limits are reusable", () => {
  assert.ok(z.string().max(1).safeParse("ab").success === false);
});
