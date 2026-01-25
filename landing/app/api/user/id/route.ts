import { requireAuth } from "@/lib/expo-auth";
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    return NextResponse.json(userId)
}
