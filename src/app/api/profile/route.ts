import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { profileSchema } from "@/features/profile/profile-schema";
import {
  deleteProfileForClerkUser,
  ensureAppUser,
  getProfileForClerkUser,
  saveProfileForClerkUser,
} from "@/features/profile/server/profile-service";

export const dynamic = "force-dynamic";

const MAX_PROFILE_BODY_BYTES = 16_384;
const noStoreHeaders = { "Cache-Control": "no-store" };

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

async function getClerkUserId(): Promise<string | null> {
  const session = await auth();
  return session.userId;
}

export async function GET() {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to view your profile.",
    );
  }

  try {
    await ensureAppUser(clerkUserId);
    const profile = await getProfileForClerkUser(clerkUserId);
    return NextResponse.json({ data: profile }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "internal", "Your profile could not be loaded.");
  }
}

export async function PUT(request: Request) {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return errorResponse(401, "unauthenticated", "Sign in to save your profile.");
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PROFILE_BODY_BYTES) {
    return errorResponse(
      413,
      "payload_too_large",
      "The profile request is too large.",
    );
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      415,
      "unsupported_media_type",
      "Send profile data as JSON.",
    );
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "The profile request could not be read.",
    );
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_PROFILE_BODY_BYTES) {
    return errorResponse(
      413,
      "payload_too_large",
      "The profile request is too large.",
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse(
      400,
      "invalid_json",
      "The profile request is not valid JSON.",
    );
  }

  const result = profileSchema.safeParse(body);
  if (!result.success) {
    return errorResponse(
      422,
      "invalid_input",
      "Review the highlighted profile fields.",
      result.error.flatten().fieldErrors,
    );
  }

  try {
    const profile = await saveProfileForClerkUser(clerkUserId, result.data);
    return NextResponse.json({ data: profile }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "internal", "Your profile could not be saved.");
  }
}

export async function DELETE(request: Request) {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return errorResponse(401, "unauthenticated", "Sign in to delete your profile.");
  }

  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }

  try {
    await deleteProfileForClerkUser(clerkUserId);
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return errorResponse(500, "internal", "Your profile could not be deleted.");
  }
}
