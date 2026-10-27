import assert from "node:assert/strict";
import test from "node:test";
import { muscleIds } from "@/features/exercises/domain/exercise";
import {
  mapMuscleToHighlighter,
  muscleMappings,
} from "./muscle-mapping";

test("defines one explicit mapping for every provider muscle", () => {
  assert.deepEqual(Object.keys(muscleMappings).sort(), [...muscleIds].sort());
});

test("maps recognized provider muscles to documented highlighter slugs", () => {
  assert.equal(mapMuscleToHighlighter("biceps"), "biceps");
  assert.equal(mapMuscleToHighlighter("pectorals"), "chest");
  assert.equal(mapMuscleToHighlighter("delts"), "deltoids");
  assert.equal(mapMuscleToHighlighter("forearms"), "forearm");
  assert.equal(mapMuscleToHighlighter("glutes"), "gluteal");
  assert.equal(mapMuscleToHighlighter("hamstrings"), "hamstring");
  assert.equal(mapMuscleToHighlighter("quads"), "quadriceps");
  assert.equal(mapMuscleToHighlighter("traps"), "trapezius");
});

test("keeps anatomically ambiguous or unsupported muscles unmapped", () => {
  assert.equal(mapMuscleToHighlighter("abductors"), null);
  assert.equal(mapMuscleToHighlighter("cardio"), null);
  assert.equal(mapMuscleToHighlighter("lats"), null);
  assert.equal(mapMuscleToHighlighter("levator-scapulae"), null);
  assert.equal(mapMuscleToHighlighter("serratus-anterior"), null);
  assert.equal(mapMuscleToHighlighter("spine"), null);
});
