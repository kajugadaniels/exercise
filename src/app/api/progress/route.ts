import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getMeasurementHistoryForClerkUser,
  getProfileForClerkUser,
} from "@/features/profile/server/profile-service";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        error: {
          code: "unauthenticated",
          message: "Sign in to view your progress.",
        },
      },
      { status: 401, headers: noStoreHeaders },
    );
  }

  try {
    const profile = await getProfileForClerkUser(userId);
    if (!profile) {
      return NextResponse.json(
        {
          error: {
            code: "profile_required",
            message: "Complete your profile before viewing progress.",
          },
        },
        { status: 428, headers: noStoreHeaders },
      );
    }

    const history = await getMeasurementHistoryForClerkUser(userId);
    return NextResponse.json({ data: history }, { headers: noStoreHeaders });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "internal",
          message: "Your progress history could not be loaded.",
        },
      },
      { status: 500, headers: noStoreHeaders },
    );
  }
}
