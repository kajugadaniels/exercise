import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { scheduleExerciseSchema } from "@/features/training/session-schema";
import { scheduleExerciseForClerkUser } from "@/features/training/server/schedule-service";

const MAX_SCHEDULE_BODY_BYTES = 4_096;
const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: noStoreHeaders },
  );
}

function hasTrustedOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to schedule an exercise.",
    );
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      415,
      "unsupported_media_type",
      "Send the exercise schedule as JSON.",
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_SCHEDULE_BODY_BYTES) {
    return errorResponse(413, "payload_too_large", "The request is too large.");
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return errorResponse(400, "invalid_request", "The request could not be read.");
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_SCHEDULE_BODY_BYTES) {
    return errorResponse(413, "payload_too_large", "The request is too large.");
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse(400, "invalid_json", "The request is not valid JSON.");
  }

  const parsed = scheduleExerciseSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      422,
      "invalid_input",
      "Choose a valid exercise, date, sets, reps, and weight.",
    );
  }

  try {
    const result = await scheduleExerciseForClerkUser(userId, parsed.data);

    if (result.status === "profile-required") {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before scheduling exercises.",
      );
    }

    if (result.status === "exercise-not-found") {
      return errorResponse(404, "exercise_not_found", "Exercise not found.");
    }

    if (result.status === "duplicate") {
      return errorResponse(
        409,
        "exercise_already_scheduled",
        "This exercise is already in that training session.",
      );
    }

    return NextResponse.json(
      { data: result },
      { status: 201, headers: noStoreHeaders },
    );
  } catch {
    return errorResponse(
      500,
      "internal",
      "The exercise could not be scheduled.",
    );
  }
}
