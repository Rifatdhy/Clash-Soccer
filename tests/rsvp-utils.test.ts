import test from "node:test";
import assert from "node:assert/strict";

import { duplicateWhatsAppNumbers } from "../src/lib/rsvp-utils.ts";

test("returns numbers that already registered for the match", () => {
  const duplicates = duplicateWhatsAppNumbers(
    [{ whatsapp: "081234567890" }, { whatsapp: "081200000000" }],
    [{ whatsapp: "081234567890" }, { whatsapp: "081299999999" }]
  );
  assert.deepEqual(duplicates, ["081234567890"]);
});

test("normalizes numbers written with plus, spaces, or dashes", () => {
  const duplicates = duplicateWhatsAppNumbers(
    [{ whatsapp: "+62 812-3456-7890" }],
    [{ whatsapp: "6281234567890" }]
  );
  assert.deepEqual(duplicates, ["6281234567890"]);
});

test("ignores participants with no phone number", () => {
  const duplicates = duplicateWhatsAppNumbers([{}], [{ whatsapp: "0812" }]);
  assert.deepEqual(duplicates, []);
});

test("accepts new numbers", () => {
  const duplicates = duplicateWhatsAppNumbers(
    [{ whatsapp: "081111111111" }],
    [{ whatsapp: "082222222222" }]
  );
  assert.deepEqual(duplicates, []);
});

test("rejects the same number twice inside one RSVP", () => {
  const duplicates = duplicateWhatsAppNumbers(
    [],
    [{ whatsapp: "081234567890" }, { whatsapp: "6281234567890" }]
  );
  assert.deepEqual(duplicates, ["6281234567890"]);
});
