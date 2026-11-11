import test from "node:test";
import assert from "node:assert/strict";
import { canPersistFaq } from "../src/lib/faq.ts";

test("a FAQ draft is persistable only when both fields have content", () => {
  assert.equal(canPersistFaq({ question: "Apa itu?", answer: "Komunitas." }), true);
  assert.equal(canPersistFaq({ question: "", answer: "Komunitas." }), false);
  assert.equal(canPersistFaq({ question: "Apa itu?", answer: "   " }), false);
});

test("whitespace-only fields do not count as content", () => {
  assert.equal(canPersistFaq({ question: "  \n ", answer: "Jawaban" }), false);
});
