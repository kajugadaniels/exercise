import assert from "node:assert/strict";
import test from "node:test";
import { isNavigationLinkActive } from "./navigation-links";

test("marks an exact navigation route as active", () => {
  assert.equal(isNavigationLinkActive("/exercises", "/exercises"), true);
});

test("keeps a navigation section active on nested routes", () => {
  assert.equal(
    isNavigationLinkActive("/exercises/abs/air-bike", "/exercises"),
    true,
  );
});

test("does not match routes that only share a prefix", () => {
  assert.equal(
    isNavigationLinkActive("/exercises-new", "/exercises"),
    false,
  );
});
