import { z } from "zod";
import {
  EXERCISE_PAGE_SIZE,
  type Exercise,
  type ExerciseFacets,
  type ExercisePage,
  type ExerciseQuery,
} from "../../domain/exercise";
import {
  ExerciseProviderError,
  type ExerciseProvider,
} from "../exercise-provider";
import { createExerciseFacets, filterExercises } from "./filters";
import {
  EXERCISE_PROVIDER_BASE_URL,
  EXERCISE_PROVIDER_VERSION,
  normalizeProviderExercise,
} from "./mapping";
import {
  providerExerciseCatalogSchema,
  providerExerciseSchema,
} from "./schema";

const MAX_RESPONSE_BYTES = 8_000_000;
const REQUEST_TIMEOUT_MS = 8_000;

const providerConfigSchema = z.object({
  baseUrl: z.literal(EXERCISE_PROVIDER_BASE_URL),
  version: z.literal(EXERCISE_PROVIDER_VERSION),
});

const exerciseIdSchema = z
  .string()
  .trim()
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type ProviderJsonFetcher = (path: string) => Promise<unknown>;

function getProviderConfig() {
  const result = providerConfigSchema.safeParse({
    baseUrl:
      process.env.EXERCISE_PROVIDER_BASE_URL ?? EXERCISE_PROVIDER_BASE_URL,
    version:
      process.env.EXERCISE_PROVIDER_VERSION ?? EXERCISE_PROVIDER_VERSION,
  });

  if (!result.success) {
    throw new ExerciseProviderError(
      "provider-invalid",
      "The exercise provider configuration is not approved.",
    );
  }

  return result.data;
}

export async function fetchExerciseProviderJson(path: string): Promise<unknown> {
  const config = getProviderConfig();
  const url = `${config.baseUrl}/api/en/${path}`;

  try {
    const response = await fetch(url, {
      cache: "force-cache",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 404) {
      throw new ExerciseProviderError(
        "not-found",
        "The requested exercise was not found.",
      );
    }

    if (!response.ok) {
      throw new ExerciseProviderError(
        "provider-unavailable",
        "The exercise provider is temporarily unavailable.",
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLocaleLowerCase("en").includes("application/json")) {
      throw new ExerciseProviderError(
        "provider-invalid",
        "The exercise provider returned an unexpected response.",
      );
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new ExerciseProviderError(
        "provider-invalid",
        "The exercise provider response exceeded the supported size.",
      );
    }

    const responseText = await response.text();
    if (new TextEncoder().encode(responseText).byteLength > MAX_RESPONSE_BYTES) {
      throw new ExerciseProviderError(
        "provider-invalid",
        "The exercise provider response exceeded the supported size.",
      );
    }

    try {
      const payload: unknown = JSON.parse(responseText);
      return payload;
    } catch {
      throw new ExerciseProviderError(
        "provider-invalid",
        "The exercise provider returned invalid JSON.",
      );
    }
  } catch (error) {
    if (error instanceof ExerciseProviderError) {
      throw error;
    }

    throw new ExerciseProviderError(
      "provider-unavailable",
      "The exercise provider could not be reached.",
    );
  }
}

function parseCatalog(payload: unknown): Exercise[] {
  const result = providerExerciseCatalogSchema.safeParse(payload);

  if (!result.success) {
    throw new ExerciseProviderError(
      "provider-invalid",
      "The exercise catalog did not match the supported format.",
    );
  }

  return result.data.exercises.map(normalizeProviderExercise);
}

function parseExercise(payload: unknown): Exercise {
  const result = providerExerciseSchema.safeParse(payload);

  if (!result.success) {
    throw new ExerciseProviderError(
      "provider-invalid",
      "The exercise details did not match the supported format.",
    );
  }

  return normalizeProviderExercise(result.data);
}

export function createExerciseGymGifsAdapter(
  fetchJson: ProviderJsonFetcher = fetchExerciseProviderJson,
): ExerciseProvider {
  let catalogPromise: Promise<Exercise[]> | undefined;

  const loadCatalog = () => {
    catalogPromise ??= fetchJson("exercises.json")
      .then(parseCatalog)
      .catch((error: unknown) => {
        catalogPromise = undefined;

        if (error instanceof ExerciseProviderError) {
          throw error;
        }

        throw new ExerciseProviderError(
          "provider-unavailable",
          "The exercise provider could not be reached.",
        );
      });

    return catalogPromise;
  };

  return {
    async list(query: ExerciseQuery): Promise<ExercisePage> {
      const exercises = filterExercises(await loadCatalog(), query);
      const pageCount = Math.max(
        1,
        Math.ceil(exercises.length / EXERCISE_PAGE_SIZE),
      );
      const page = Math.min(query.page, pageCount);
      const start = (page - 1) * EXERCISE_PAGE_SIZE;

      return {
        exercises: exercises.slice(start, start + EXERCISE_PAGE_SIZE),
        total: exercises.length,
        page,
        pageSize: EXERCISE_PAGE_SIZE,
        pageCount,
      };
    },

    async getById(id: string): Promise<Exercise | null> {
      const parsedId = exerciseIdSchema.safeParse(id);
      if (!parsedId.success) {
        return null;
      }

      try {
        return parseExercise(
          await fetchJson(`exercises/${parsedId.data}.json`),
        );
      } catch (error) {
        if (
          error instanceof ExerciseProviderError &&
          error.code === "not-found"
        ) {
          return null;
        }

        if (error instanceof ExerciseProviderError) {
          throw error;
        }

        throw new ExerciseProviderError(
          "provider-unavailable",
          "The exercise provider could not be reached.",
        );
      }
    },

    async facets(): Promise<ExerciseFacets> {
      return createExerciseFacets(await loadCatalog());
    },
  };
}

export const exerciseGymGifsAdapter = createExerciseGymGifsAdapter();
