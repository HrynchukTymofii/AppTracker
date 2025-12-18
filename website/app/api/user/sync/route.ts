import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db"; // adjust import path if needed
import { requireAuth } from "@/lib/expo-auth";

export async function POST(req: NextRequest) {
  try {
    // ✅ Check auth
    const authResult = requireAuth(req);
    if ("userId" in authResult === false) {
      return authResult; 
    }
    const { userId } = authResult;

    // ✅ Update only if needed
    const updatedUser = await db.user.update({
      where: { userId },
      data: { needSync: false },
    });

    return NextResponse.json(updatedUser);
  } catch (err) {
    console.error("❌ sync error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
