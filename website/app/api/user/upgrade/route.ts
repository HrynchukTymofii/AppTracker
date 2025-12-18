import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";
import { NextRequest, NextResponse } from "next/server";

const COURSE_ID = process.env.COURSE_ID || "";

export async function POST(req: NextRequest) {
  // Authenticate the user
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    // Get the request body
    const body = await req.json();
    const { plan } = body as { plan: string };

    if (!plan || (plan !== "PRO Yearly" && plan !== "PRO Monthly")) {
      return NextResponse.json(
        { error: "Invalid plan type: " + plan },
        { status: 400 }
      );
    }

    // Compute start and end dates
    const startAt = new Date();
    let endAt: Date | null = null;

    if (plan === "PRO Yearly") {
      endAt = new Date();
      endAt.setFullYear(endAt.getFullYear() + 1);
    } else if (plan === "PRO Monthly") {
      endAt = new Date();
      endAt.setMonth(endAt.getMonth() + 1);
    }

    // Create the purchase
    const purchase = await db.purchase.create({
      data: {
        userId,
        courseId: COURSE_ID,
        plan,
        startAt,
        endAt,
      },
    });

    await db.user.update({
      where: { userId },
      data: { isPro: true },
    });

    return NextResponse.json({ success: true, purchase });
  } catch (error: any) {
    console.error("❌ upgradeToPro error:", error);
    return NextResponse.json(
      { error: "Failed to create purchase" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  // Authenticate the user
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    await db.user.update({
      where: { userId },
      data: { isPro: false },
    });

    return NextResponse.json({ success: true});
  } catch (error: any) {
    console.error("❌ removePro error:", error);
    return NextResponse.json(
      { error: "Failed to remove PRO for user" },
      { status: 500 }
    );
  }
}


// import { db } from "@/lib/db";
// import { requireAuth } from "@/lib/expo-auth";
// import { NextRequest, NextResponse } from "next/server";

// const COURSE_ID = process.env.COURSE_ID || "";

// export async function POST(req: NextRequest) {
//   // Authenticate the user
//   const auth = await requireAuth(req);
//   if (auth instanceof NextResponse) return auth;
//   const { userId } = auth;

//   try {
//     // Get the request body
//     const body = await req.json();
//     const { plan} = body as { plan: string };

//     if (!plan || (plan !== "monthly" && plan !== "forever")) {
//       return NextResponse.json({ error: "Invalid plan type" + plan }, { status: 400 });
//     }

//     // Compute start and end dates
//     const startAt = new Date();
//     let endAt: Date | null = null;

//     if (plan === "monthly") {
//       endAt = new Date();
//       endAt.setMonth(endAt.getMonth() + 1);
//     }

//     // Create the purchase
//     const purchase = await db.purchase.create({
//       data: {
//         userId,
//         courseId: COURSE_ID,
//         plan,
//         startAt,
//         endAt,
//       },
//     });

//     const updatedUser = await db.user.update({
//       where: { userId },
//       data: {
//         isPro: true,
//       },
//     });

//     return NextResponse.json({ success: true, purchase });
//   } catch (error: any) {
//     console.error("❌ upgradeToPro error:", error);
//     return NextResponse.json(
//       { error: "Failed to create purchase" },
//       { status: 500 }
//     );
//   }
// }
