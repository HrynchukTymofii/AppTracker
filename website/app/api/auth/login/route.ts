import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createJwtToken } from "@/lib/jwt";


export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { email, platform: "SATecosystem" },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = createJwtToken(user);
    return NextResponse.json({ token });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { db } from "@/lib/db";
// import { createJwtToken } from "@/lib/jwt"; 

// export async function POST(req: Request) {
//   const { email, password } = await req.json();

//   if (!email || !password) {
//     return NextResponse.json({ error: "Missing fields" }, { status: 400 });
//   }

//   const user = await db.user.findFirst({ where: { email, platform: "PDRecosystem" } });
//   if (!user || !user.password) {
//     return NextResponse.json({ error: "User not found" }, { status: 404 });
//   }

//   const valid = await bcrypt.compare(password, user.password);
//   if (!valid) {
//     return NextResponse.json({ error: "Invalid password" }, { status: 401 });
//   }

//   const token = await createJwtToken(user); 
//   return NextResponse.json({ token });
// }
