import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  bodyPartIds,
  exerciseCategoryIds,
} from "@/features/exercises/domain/exercise";
import { getExerciseCatalogPage } from "@/features/exercises/server/exercise-catalog";
import { ExerciseProviderError } from "@/features/exercises/providers/exercise-provider";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";

const noStoreHeaders = { "Cache-Control": "private, no-store" };
const allowedQueryKeys = new Set(["bodyPart", "category", "page", "search"]);
const MAX_QUERY_LENGTH = 256;

const catalogQuerySchema = z
  .object({
    bodyPart: z.enum(bodyPartIds).optional(),
    category: z.enum(exerciseCategoryIds).optional(),
    page: z.coerce.number().int().min(1).max(100).default(1),
    search: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.string().trim().min(1).max(80).optional(),
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
    if (!allowedQueryKeys.has(key) || searchParams.getAll(key).length !== 1) {
      return null;
    }
  }

  const result = catalogQuerySchema.safeParse({
    bodyPart: searchParams.get("bodyPart") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  return result.success ? result.data : null;
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
      "Use a valid body part, category, search term, and page number.",
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
