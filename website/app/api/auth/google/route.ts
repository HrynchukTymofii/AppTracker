import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db"; 
import { createJwtToken } from "@/lib/jwt";


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { id_token } = await req.json();
    if (!id_token) return NextResponse.json({ error: "Missing id_token" }, { status: 400 });

    // 🔐 Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) return NextResponse.json({ error: "No email from Google" }, { status: 400 });

    const email = payload.email;
    const name = payload.name || "Student";
    const imageUrl = payload.picture;

    // 🧠 Check or create user in DB
    let user = await db.user.findFirst({ where: { email, platform: "SATecosystem" } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name,
          platform: "SATecosystem",
          image: imageUrl,
        },
      });
    }

    const token = createJwtToken(user);
    return NextResponse.json({ token });

  } catch (err) {
    console.error("[GOOGLE CALLBACK ERROR]", err);
    return NextResponse.json({ error: "Failed to verify Google token" }, { status: 500 });
  }
}
