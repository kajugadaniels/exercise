import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import { getCalendarDateInTimeZone } from "@/features/training/domain/training";
import { getTrainingAnalyticsForClerkUser } from "@/features/training/server/training-analytics-service";
import { getTrainingPreferencesForClerkUser } from "@/features/training/server/training-preferences-service";
import { trainingAnalyticsQuerySchema } from "@/features/training/training-analytics-schema";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: noStoreHeaders },
  );
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(401, "unauthenticated", "Sign in to view progress.");
  }

  const url = new URL(request.url);
  const result = trainingAnalyticsQuerySchema.safeParse({
    weeks: url.searchParams.get("weeks") ?? undefined,
  });
  if (!result.success) {
    return errorResponse(
      422,
      "invalid_input",
      "Choose a 4, 8, or 12 week progress range.",
    );
  }

  try {
    const [profile, preferences] = await Promise.all([
      getProfileForClerkUser(userId),
      getTrainingPreferencesForClerkUser(userId),
    ]);
    if (!profile) {
      return errorResponse(
        428,
        "profile_required",
        "Complete your profile before viewing training progress.",
      );
    }
    const endDate = getCalendarDateInTimeZone(preferences?.timezone ?? "UTC");
    const analytics = await getTrainingAnalyticsForClerkUser(
      userId,
      result.data.weeks,
      endDate,
    );
    return NextResponse.json({ data: analytics }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(
      500,
      "internal",
      "Your training progress could not be loaded.",
    );
  }
}
