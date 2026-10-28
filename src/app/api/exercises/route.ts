import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  bodyPartIds,
  equipmentIds,
  exerciseCategoryIds,
  muscleIds,
} from "@/features/exercises/domain/exercise";
import { getExerciseCatalogPage } from "@/features/exercises/server/exercise-catalog";
import { ExerciseProviderError } from "@/features/exercises/providers/exercise-provider";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const allowedQueryKeys = new Set([
  "bodyPart",
  "category",
  "equipment",
  "muscle",
  "page",
  "search",
]);
const MAX_QUERY_LENGTH = 1_024;

const catalogQuerySchema = z
  .object({
    bodyPart: z
      .array(z.enum(bodyPartIds))
      .max(bodyPartIds.length)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
    category: z
      .array(z.enum(exerciseCategoryIds))
      .max(exerciseCategoryIds.length)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
    equipment: z
      .array(z.enum(equipmentIds))
      .max(equipmentIds.length)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
    muscle: z
      .array(z.enum(muscleIds))
      .max(muscleIds.length)
      .refine((values) => new Set(values).size === values.length)
      .optional(),
    page: z.coerce.number().int().min(1).max(100).default(1),
    search: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().trim().min(3).max(80).optional(),
    ),
  })
  .strict();

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: noStoreHeaders },
  );
}

function readCatalogQuery(request: Request) {
  const { search, searchParams } = new URL(request.url);

  if (search.length > MAX_QUERY_LENGTH) {
    return null;
  }

  for (const key of searchParams.keys()) {
    if (
      !allowedQueryKeys.has(key) ||
      ((key === "page" || key === "search") &&
        searchParams.getAll(key).length !== 1)
    ) {
      return null;
    }
  }

  const values = (key: string) => {
    const submittedValues = searchParams.getAll(key);
    return submittedValues.length > 0 ? submittedValues : undefined;
  };

  const result = catalogQuerySchema.safeParse({
    bodyPart: values("bodyPart"),
    category: values("category"),
    equipment: values("equipment"),
    muscle: values("muscle"),
    page: searchParams.get("page") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!result.success) {
    return null;
  }

  return {
    ...(result.data.bodyPart ? { bodyParts: result.data.bodyPart } : {}),
    ...(result.data.category ? { categories: result.data.category } : {}),
    ...(result.data.equipment ? { equipment: result.data.equipment } : {}),
    ...(result.data.muscle ? { muscles: result.data.muscle } : {}),
    page: result.data.page,
    ...(result.data.search ? { search: result.data.search } : {}),
  };
}

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to view exercises.");
  }

  let hasProfile: boolean;

  try {
    hasProfile = Boolean(await getProfileForClerkUser(userId));
  } catch {
    return errorResponse(
      500,
      "internal",
      "Exercises could not be loaded.",
    );
  }

  if (!hasProfile) {
    return errorResponse(
      428,
      "profile_required",
      "Complete your profile before viewing exercises.",
    );
  }

  const query = readCatalogQuery(request);
  if (!query) {
    return errorResponse(
      400,
      "invalid_query",
      "Use valid exercise filters, a search term of at least 3 characters, and a supported page number.",
    );
  }

  try {
    const data = await getExerciseCatalogPage(query);
    return NextResponse.json({ data }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof ExerciseProviderError) {
      const status = error.code === "provider-invalid" ? 502 : 503;
      return errorResponse(
        status,
        error.code,
        "Exercises are temporarily unavailable. Try again shortly.",
      );
    }

    return errorResponse(
      500,
      "internal",
      "Exercises could not be loaded.",
    );
  }
}
