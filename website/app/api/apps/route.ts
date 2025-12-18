import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/apps/need-sync/:id
 * 
 * Returns needSync status for a specific app by ID
 */
export async function GET(req: NextRequest) {
  try {
    // The app ID you want to check
    const appId = "3b29ad03-9b43-49c7-b53f-4ab02767eaae";

    // Fetch the app
    const app = await db.apps.findUnique({
      where: { id: appId },
      select: {
        name: true,
        needSync: true,
      },
    });

    if (!app) {
      return NextResponse.json(
        { error: "App not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ app });
  } catch (error) {
    console.error("❌ Failed to fetch app needSync status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
