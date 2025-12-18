import { updateUserPoints } from "@/app/actions/user-actions"
import { requireAuth } from "@/lib/expo-auth";
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const authResult = requireAuth(req);
    if ("userId" in authResult === false) {
      return authResult;
    }

    const { userId } = authResult;

    const { points } = await req.json();
    if (!points) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const result = await updateUserPoints(userId, points, "mobile");
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in update-points API:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
