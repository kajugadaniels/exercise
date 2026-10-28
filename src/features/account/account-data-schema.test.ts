import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_DATA_DELETE_CONFIRMATION,
  deleteAccountDataSchema,
} from "./account-data-schema";

test("requires the exact account data deletion phrase", () => {
  assert.equal(
    deleteAccountDataSchema.safeParse({
      confirmation: ACCOUNT_DATA_DELETE_CONFIRMATION,
    }).success,
    true,
  );
  assert.equal(
    deleteAccountDataSchema.safeParse({ confirmation: "delete my data" })
      .success,
    false,
  );
});

test("rejects ownership and unknown deletion fields", () => {
  assert.equal(
    deleteAccountDataSchema.safeParse({
      confirmation: ACCOUNT_DATA_DELETE_CONFIRMATION,
      userId: "untrusted-owner",
    }).success,
    false,
  );
});
