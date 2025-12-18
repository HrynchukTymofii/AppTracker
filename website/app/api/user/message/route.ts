import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/getAuth";
import { requireAuth } from "@/lib/expo-auth";

export async function POST(req: NextRequest) {
  let userId: string | null = null;

  const session = await auth()
  if (session?.user?.userId) {
    userId = session.user.userId
  }

  if (!userId) {
    const authResult = requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    userId = authResult.userId
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { topic, message } = body;

  if (!topic || !message) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await db.userMessage.create({
    data: {
      topic,
      message,
      userId,
    },
  });

  return NextResponse.json({ success: true });
}
