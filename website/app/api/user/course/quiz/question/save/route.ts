import { NextRequest, NextResponse } from "next/server";
import { toggleSave } from "@/app/actions/questions";
import { requireAuth } from "@/lib/expo-auth";


export async function POST(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { questionId } = await req.json();

  if (!questionId) {
    return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
  }

  try {
    const saved = await toggleSave(userId, questionId);
    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Error toggling save:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
