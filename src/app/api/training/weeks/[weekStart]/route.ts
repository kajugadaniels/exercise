import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ExerciseProviderError } from "@/features/exercises/providers/exercise-provider";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import {
  deleteTrainingWeekForClerkUser,
  getTrainingWeekForClerkUser,
  saveTrainingWeekForClerkUser,
  TrainingWeekConflictError,
  TrainingWeekExerciseNotFoundError,
} from "@/features/training/server/training-week-service";
import {
  createTrainingWeekInputSchema,
  trainingWeekStartSchema,
} from "@/features/training/training-week-schema";

const MAX_TRAINING_WEEK_BODY_BYTES = 65_536;
const noStoreHeaders = { "Cache-Control": "private, no-store" };

type RouteContext = {
  params: Promise<{ weekStart: string }>;
};

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

async function getWeekStart(
  context: RouteContext,
): Promise<string | null> {
  const { weekStart } = await context.params;
  const result = trainingWeekStartSchema.safeParse(weekStart);
  return result.success ? result.data : null;
}

async function hasCompletedProfile(clerkUserId: string): Promise<boolean> {
  return Boolean(await getProfileForClerkUser(clerkUserId));
}

function providerErrorResponse(error: ExerciseProviderError) {
  const status = error.code === "provider-invalid" ? 502 : 503;
  return errorResponse(
    status,
    error.code,
    "Exercises could not be verified while saving this week. Try again shortly.",
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to view your training week.",
    );
  }

  const weekStart = await getWeekStart(context);
  if (!weekStart) {
    return errorResponse(
      400,
      "invalid_week_start",
      "Use a valid Monday date in YYYY-MM-DD format.",
    );
  }

  try {
    if (!(await hasCompletedProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before viewing training plans.",
      );
    }

    const week = await getTrainingWeekForClerkUser(userId, weekStart);
    return NextResponse.json({ data: week }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your training week could not be loaded.",
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to save your training week.",
    );
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const weekStart = await getWeekStart(context);
  if (!weekStart) {
    return errorResponse(
      400,
      "invalid_week_start",
      "Use a valid Monday date in YYYY-MM-DD format.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_TRAINING_WEEK_BODY_BYTES) {
    return errorResponse(
      413,
      "payload_too_large",
      "The training week request is too large.",
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      415,
      "unsupported_media_type",
      "Send the training week as JSON.",
    );
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "The training week request could not be read.",
    );
  }

  if (
    new TextEncoder().encode(bodyText).byteLength >
    MAX_TRAINING_WEEK_BODY_BYTES
  ) {
    return errorResponse(
      413,
      "payload_too_large",
      "The training week request is too large.",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse(
      400,
      "invalid_json",
      "The training week request is not valid JSON.",
    );
  }

  const result = createTrainingWeekInputSchema(weekStart).safeParse(body);
  if (!result.success) {
    return errorResponse(
      422,
      "invalid_input",
      "Review the highlighted training week details.",
      result.error.flatten().fieldErrors,
    );
  }

  try {
    if (!(await hasCompletedProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before saving training plans.",
      );
    }

    const week = await saveTrainingWeekForClerkUser(
      userId,
      weekStart,
      result.data,
    );
    return NextResponse.json({ data: week }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof TrainingWeekConflictError) {
      return errorResponse(
        409,
        "training_history_exists",
        "A week with started, completed, or skipped workouts cannot be replaced.",
      );
    }

    if (error instanceof TrainingWeekExerciseNotFoundError) {
      return errorResponse(
        422,
        "exercise_unavailable",
        "One or more selected exercises are no longer available.",
      );
    }

    if (error instanceof ExerciseProviderError) {
      return providerErrorResponse(error);
    }

    return errorResponse(
      500,
      "internal",
      "Your training week could not be saved.",
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to delete your training week.",
    );
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const weekStart = await getWeekStart(context);
  if (!weekStart) {
    return errorResponse(
      400,
      "invalid_week_start",
      "Use a valid Monday date in YYYY-MM-DD format.",
    );
  }

  try {
    if (!(await hasCompletedProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before deleting training plans.",
      );
    }

    await deleteTrainingWeekForClerkUser(userId, weekStart);
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof TrainingWeekConflictError) {
      return errorResponse(
        409,
        "training_history_exists",
        "A week with started, completed, or skipped workouts cannot be deleted.",
      );
    }

    return errorResponse(
      500,
      "internal",
      "Your training week could not be deleted.",
    );
  }
}
