import type {
  Exercise,
  ExerciseFacets,
  ExercisePage,
  ExerciseQuery,
} from "../domain/exercise";

export type ExerciseProvider = {
  list(query: ExerciseQuery): Promise<ExercisePage>;
  getById(id: string): Promise<Exercise | null>;
  facets(): Promise<ExerciseFacets>;
};

export type ExerciseProviderErrorCode =
  | "not-found"
  | "provider-invalid"
  | "provider-unavailable";

export class ExerciseProviderError extends Error {
  readonly code: ExerciseProviderErrorCode;

  constructor(code: ExerciseProviderErrorCode, message: string) {
    super(message);
    this.name = "ExerciseProviderError";
    this.code = code;
  }
}
