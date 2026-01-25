import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/getAuth";
import { requireAuth } from "@/lib/expo-auth";

const allowedOrigins = [
  "https://lockin.fibipals.com",
  "https://www.fibipals.com",
  "https://fibipals.com",
];

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: getCorsHeaders(origin) });
  }

  const body = await req.json();
  const { topic, message } = body;

  if (!topic || !message) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: getCorsHeaders(origin) });
  }

  await db.userMessage.create({
    data: {
      topic,
      message,
      userId,
    },
  });

  return NextResponse.json({ success: true }, { headers: getCorsHeaders(origin) });
}
