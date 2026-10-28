import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import {
  finishWorkoutForClerkUser,
  getWorkoutForClerkUser,
  recordWorkoutSetForClerkUser,
  startWorkoutForClerkUser,
  WorkoutDayUnavailableError,
  WorkoutIncompleteError,
  WorkoutNotFoundError,
  WorkoutSessionConflictError,
  WorkoutSessionNotStartedError,
  WorkoutSetNotFoundError,
} from "@/features/training/server/workout-session-service";
import {
  workoutDateSchema,
  workoutSessionActionSchema,
} from "@/features/training/workout-session-schema";

const MAX_WORKOUT_ACTION_BODY_BYTES = 16_384;
const noStoreHeaders = { "Cache-Control": "private, no-store" };

type RouteContext = {
  params: Promise<{ plannedDate: string }>;
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

async function getPlannedDate(
  context: RouteContext,
): Promise<string | null> {
  const { plannedDate } = await context.params;
  const result = workoutDateSchema.safeParse(plannedDate);
  return result.success ? result.data : null;
}

async function hasCompletedProfile(clerkUserId: string): Promise<boolean> {
  return Boolean(await getProfileForClerkUser(clerkUserId));
}

function workoutErrorResponse(error: unknown) {
  if (error instanceof WorkoutNotFoundError) {
    return errorResponse(404, "workout_not_found", "This workout was not found.");
  }

  if (error instanceof WorkoutDayUnavailableError) {
    return errorResponse(
      409,
      "workout_unavailable",
      "This day does not contain a workout that can be started.",
    );
  }

  if (error instanceof WorkoutSessionNotStartedError) {
    return errorResponse(
      409,
      "workout_not_started",
      "Start this workout before recording activity.",
    );
  }

  if (error instanceof WorkoutSessionConflictError) {
    return errorResponse(
      409,
      "workout_already_ended",
      "This workout has already ended and can no longer be changed.",
    );
  }

  if (error instanceof WorkoutSetNotFoundError) {
    return errorResponse(
      422,
      "set_not_found",
      "The selected planned set could not be found.",
    );
  }

  if (error instanceof WorkoutIncompleteError) {
    return errorResponse(
      409,
      "workout_incomplete",
      "Record every planned set before completing this workout.",
    );
  }

  return errorResponse(
    500,
    "internal",
    "Your workout could not be updated.",
  );
}

async function readActionBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_WORKOUT_ACTION_BODY_BYTES) {
    return {
      response: errorResponse(
        413,
        "payload_too_large",
        "The workout request is too large.",
      ),
    } as const;
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return {
      response: errorResponse(
        415,
        "unsupported_media_type",
        "Send the workout action as JSON.",
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
        "The workout request could not be read.",
      ),
    } as const;
  }

  if (
    new TextEncoder().encode(bodyText).byteLength >
    MAX_WORKOUT_ACTION_BODY_BYTES
  ) {
    return {
      response: errorResponse(
        413,
        "payload_too_large",
        "The workout request is too large.",
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
        "The workout request is not valid JSON.",
      ),
    } as const;
  }

  const result = workoutSessionActionSchema.safeParse(body);
  if (!result.success) {
    return {
      response: errorResponse(
        422,
        "invalid_input",
        "Review the workout details and try again.",
        result.error.flatten().fieldErrors,
      ),
    } as const;
  }

  return { data: result.data } as const;
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to view this workout.");
  }

  const plannedDate = await getPlannedDate(context);
  if (!plannedDate) {
    return errorResponse(
      400,
      "invalid_planned_date",
      "Use a valid workout date in YYYY-MM-DD format.",
    );
  }

  try {
    if (!(await hasCompletedProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before viewing workouts.",
      );
    }

    const workout = await getWorkoutForClerkUser(userId, plannedDate);
    if (!workout) {
      return errorResponse(
        404,
        "workout_not_found",
        "This workout was not found.",
      );
    }

    return NextResponse.json({ data: workout }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "internal", "Your workout could not be loaded.");
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to start this workout.");
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const plannedDate = await getPlannedDate(context);
  if (!plannedDate) {
    return errorResponse(
      400,
      "invalid_planned_date",
      "Use a valid workout date in YYYY-MM-DD format.",
    );
  }

  try {
    if (!(await hasCompletedProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before starting workouts.",
      );
    }

    const workout = await startWorkoutForClerkUser(userId, plannedDate);
    return NextResponse.json({ data: workout }, { headers: noStoreHeaders });
  } catch (error) {
    return workoutErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to update this workout.");
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const plannedDate = await getPlannedDate(context);
  if (!plannedDate) {
    return errorResponse(
      400,
      "invalid_planned_date",
      "Use a valid workout date in YYYY-MM-DD format.",
    );
  }

  const bodyResult = await readActionBody(request);
  if ("response" in bodyResult) {
    return bodyResult.response;
  }

  try {
    if (!(await hasCompletedProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before updating workouts.",
      );
    }

    const workout =
      bodyResult.data.action === "record-set"
        ? await recordWorkoutSetForClerkUser(
            userId,
            plannedDate,
            bodyResult.data,
          )
        : await finishWorkoutForClerkUser(
            userId,
            plannedDate,
            bodyResult.data.action,
          );

    return NextResponse.json({ data: workout }, { headers: noStoreHeaders });
  } catch (error) {
    return workoutErrorResponse(error);
  }
}
