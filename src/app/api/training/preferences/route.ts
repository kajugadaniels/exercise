import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import {
  deleteTrainingPreferencesForClerkUser,
  getTrainingPreferencesForClerkUser,
  saveTrainingPreferencesForClerkUser,
} from "@/features/training/server/training-preferences-service";
import { trainingPreferencesSchema } from "@/features/training/training-preferences-schema";

const MAX_PREFERENCES_BODY_BYTES = 16_384;
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

async function requireProfile(clerkUserId: string): Promise<boolean> {
  return Boolean(await getProfileForClerkUser(clerkUserId));
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to view your training preferences.",
    );
  }

  try {
    if (!(await requireProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before managing training preferences.",
      );
    }

    const preferences = await getTrainingPreferencesForClerkUser(userId);
    return NextResponse.json(
      { data: preferences },
      { headers: noStoreHeaders },
    );
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your training preferences could not be loaded.",
    );
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to save your training preferences.",
    );
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PREFERENCES_BODY_BYTES) {
    return errorResponse(
      413,
      "payload_too_large",
      "The training preferences request is too large.",
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      415,
      "unsupported_media_type",
      "Send training preferences as JSON.",
    );
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "The training preferences request could not be read.",
    );
  }

  if (
    new TextEncoder().encode(bodyText).byteLength > MAX_PREFERENCES_BODY_BYTES
  ) {
    return errorResponse(
      413,
      "payload_too_large",
      "The training preferences request is too large.",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse(
      400,
      "invalid_json",
      "The training preferences request is not valid JSON.",
    );
  }

  const result = trainingPreferencesSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      422,
      "invalid_input",
      "Review the highlighted training preferences.",
      result.error.flatten().fieldErrors,
    );
  }

  try {
    if (!(await requireProfile(userId))) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before saving training preferences.",
      );
    }

    const preferences = await saveTrainingPreferencesForClerkUser(
      userId,
      result.data,
    );
    return NextResponse.json(
      { data: preferences },
      { headers: noStoreHeaders },
    );
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your training preferences could not be saved.",
    );
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to clear your training preferences.",
    );
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  try {
    await deleteTrainingPreferencesForClerkUser(userId);
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your training preferences could not be cleared.",
    );
  }
}
