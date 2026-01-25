import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose"; 
import { db } from "@/lib/db"; 
import { createJwtToken } from "@/lib/jwt";

// Fetch Apple public keys once and cache them
let appleJWKS: jose.JWTVerifyGetKey;

async function getAppleJWKS() {
  if (!appleJWKS) {
    const JWKS = jose.createRemoteJWKSet(
      new URL("https://appleid.apple.com/auth/keys")
    );
    appleJWKS = JWKS;
  }
  return appleJWKS;
}

export async function POST(req: NextRequest) {
  try {
    const { id_token, name: frontendName, email: frontendEmail } = await req.json();
    if (!id_token) {
      return NextResponse.json({ error: "Missing id_token" }, { status: 400 });
    }

    // 🔐 Verify Apple ID token
    const JWKS = await getAppleJWKS();
    const { payload } = await jose.jwtVerify(id_token, JWKS, {
      issuer: "https://appleid.apple.com",
      audience: process.env.LOCKIN_APPLE_CLIENT_ID,
    });

    const email = frontendEmail || (payload.email as string | undefined);
    const name = frontendName || "Achiever";

    if (!email) {
      return NextResponse.json({ error: "No email from Apple" }, { status: 400 });
    }

    // 🧠 Check or create user in DB
    let user = await db.user.findFirst({
      where: { email, platform: "LockIn" },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name,
          platform: "LockIn",
        },
      });
    }

    // 🎫 Create your own JWT
    const token = createJwtToken(user);

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[APPLE CALLBACK ERROR]", err);
    return NextResponse.json({ error: "Failed to verify Apple token" }, { status: 500 });
  }
}
