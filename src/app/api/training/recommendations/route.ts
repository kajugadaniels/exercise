import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ExerciseProviderError } from "@/features/exercises/providers/exercise-provider";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import { dailyRecommendationInputSchema } from "@/features/training/daily-recommendation-schema";
import {
  previewDailyRecommendationForClerkUser,
  RecommendationCapacityError,
  RecommendationDayConflictError,
  RecommendationPastDateError,
  RecommendationPreferencesRequiredError,
  RecommendationUnavailableError,
  saveDailyRecommendationForClerkUser,
} from "@/features/training/server/daily-recommendation-service";

const MAX_RECOMMENDATION_BODY_BYTES = 16_384;
const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string[] | undefined>,
) {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status, headers: noStoreHeaders },
  );
}

function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}

async function readInput(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_RECOMMENDATION_BODY_BYTES) {
    return {
      response: errorResponse(
        413,
        "payload_too_large",
        "The recommendation request is too large.",
      ),
    } as const;
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {
      response: errorResponse(
        415,
        "unsupported_media_type",
        "Send the recommendation request as JSON.",
      ),
    } as const;
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return {
      response: errorResponse(
        400,
        "invalid_request",
        "The recommendation request could not be read.",
      ),
    } as const;
  }

  if (
    new TextEncoder().encode(bodyText).byteLength >
    MAX_RECOMMENDATION_BODY_BYTES
  ) {
    return {
      response: errorResponse(
        413,
        "payload_too_large",
        "The recommendation request is too large.",
      ),
    } as const;
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return {
      response: errorResponse(
        400,
        "invalid_json",
        "The recommendation request is not valid JSON.",
      ),
    } as const;
  }

  const result = dailyRecommendationInputSchema.safeParse(body);
  return result.success
    ? ({ input: result.data } as const)
    : ({
        response: errorResponse(
          422,
          "invalid_input",
          "Review the recommendation details.",
          result.error.flatten().fieldErrors,
        ),
      } as const);
}

function recommendationErrorResponse(error: unknown) {
  if (error instanceof RecommendationPreferencesRequiredError) {
    return errorResponse(
      428,
      "preferences_required",
      "Set your training preferences before requesting a recommendation.",
    );
  }
  if (error instanceof RecommendationPastDateError) {
    return errorResponse(
      422,
      "past_date",
      "Choose today or a future date for this recommendation.",
    );
  }
  if (error instanceof RecommendationDayConflictError) {
    return errorResponse(
      409,
      "workout_history_exists",
      "This day has recorded workout activity and cannot be replaced.",
    );
  }
  if (error instanceof RecommendationCapacityError) {
    return errorResponse(
      422,
      "week_capacity_exceeded",
      "This recommendation would make the weekly plan too large.",
    );
  }
  if (error instanceof RecommendationUnavailableError) {
    return errorResponse(
      422,
      "recommendation_unavailable",
      "No supported exercises match this focus and your available equipment.",
    );
  }
  if (error instanceof ExerciseProviderError) {
    return errorResponse(
      error.code === "provider-invalid" ? 502 : 503,
      error.code,
      "Exercises could not be prepared right now. Try again shortly.",
    );
  }

  return errorResponse(
    500,
    "internal",
    "Your recommendation could not be prepared.",
  );
}

async function handleRecommendation(
  request: Request,
  action: "preview" | "save",
) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to request a training recommendation.",
    );
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const parsed = await readInput(request);
  if ("response" in parsed) {
    return parsed.response;
  }

  try {
    if (!(await getProfileForClerkUser(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before requesting training plans.",
      );
    }

    const data =
      action === "save"
        ? await saveDailyRecommendationForClerkUser(userId, parsed.input)
        : await previewDailyRecommendationForClerkUser(userId, parsed.input);
    return NextResponse.json({ data }, { headers: noStoreHeaders });
  } catch (error) {
    return recommendationErrorResponse(error);
  }
}

export async function POST(request: Request) {
  return handleRecommendation(request, "preview");
}

export async function PUT(request: Request) {
  return handleRecommendation(request, "save");
}
