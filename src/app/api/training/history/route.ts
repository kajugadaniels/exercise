import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import {
  getCalendarDateInTimeZone,
  getTrainingWeekStartForDate,
} from "@/features/training/domain/training";
import { getTrainingHistoryForClerkUser } from "@/features/training/server/training-history-service";
import { getTrainingPreferencesForClerkUser } from "@/features/training/server/training-preferences-service";
import { trainingHistoryQuerySchema } from "@/features/training/training-history-schema";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: noStoreHeaders },
  );
}

function firstSearchParam(value: string | null): string | undefined {
  return value ?? undefined;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse(
      401,
      "unauthenticated",
      "Sign in to view training history.",
    );
  }

  const url = new URL(request.url);
  const queryResult = trainingHistoryQuerySchema.safeParse({
    page: firstSearchParam(url.searchParams.get("page")),
    week: firstSearchParam(url.searchParams.get("week")),
  });

  if (!queryResult.success) {
    return errorResponse(
      400,
      "invalid_query",
      "Use a valid Monday and page number for training history.",
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
        "Complete your profile before viewing training history.",
      );
    }

    const currentCalendarDate = getCalendarDateInTimeZone(
      preferences?.timezone ?? "UTC",
    );
    const currentWeekStart = getTrainingWeekStartForDate(currentCalendarDate);

    if (!currentWeekStart) {
      throw new Error("The current training week could not be determined.");
    }

    const history = await getTrainingHistoryForClerkUser(
      userId,
      queryResult.data.week ?? currentWeekStart,
      queryResult.data.page,
    );

    return NextResponse.json({ data: history }, { headers: noStoreHeaders });
  } catch {
    return errorResponse(
      500,
      "internal",
      "Training history could not be loaded.",
    );
  }
}
