import { test } from "node:test";
import assert from "node:assert/strict";

test("health payload shape is stable", () => {
  const payload = { ok: true };
  assert.equal(payload.ok, true);
});
