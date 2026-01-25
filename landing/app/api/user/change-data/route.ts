import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  const { name, password } = await req.json();

  try {
    const updateData: any = { };
    if (name) updateData.name = name;
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    await db.user.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({ message: "Profile updated" });
  } catch (err) {
    console.error("❌ Update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
