import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteAccountDataSchema } from "@/features/account/account-data-schema";
import {
  deleteAccountDataForClerkUser,
  getAccountDataExportForClerkUser,
} from "@/features/account/server/account-data-service";

const MAX_DELETE_BODY_BYTES = 16_384;
const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: noStoreHeaders },
  );
}

function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to export your data.");
  }

  try {
    const data = await getAccountDataExportForClerkUser(userId);
    if (!data) {
      return errorResponse(
        404,
        "account_not_found",
        "No fitness data was found.",
      );
    }
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        ...noStoreHeaders,
        "Content-Disposition": `attachment; filename="fitness-data-${date}.json"`,
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your fitness data could not be exported.",
    );
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to delete your data.");
  }
  if (!hasTrustedOrigin(request)) {
    return errorResponse(403, "forbidden", "This request is not allowed.");
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse(
      415,
      "unsupported_media_type",
      "Send the deletion confirmation as JSON.",
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_DELETE_BODY_BYTES) {
    return errorResponse(413, "payload_too_large", "The request is too large.");
  }

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "The request could not be read.",
    );
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_DELETE_BODY_BYTES) {
    return errorResponse(413, "payload_too_large", "The request is too large.");
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return errorResponse(400, "invalid_json", "The request is not valid JSON.");
  }
  if (!deleteAccountDataSchema.safeParse(body).success) {
    return errorResponse(
      422,
      "confirmation_required",
      "Enter the exact confirmation phrase before deleting your fitness data.",
    );
  }

  try {
    await deleteAccountDataForClerkUser(userId);
    return new NextResponse(null, { status: 204, headers: noStoreHeaders });
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your fitness data could not be deleted.",
    );
  }
}
