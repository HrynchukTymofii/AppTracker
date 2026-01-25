import { db } from "@/lib/db";
import { requireAuth } from "@/lib/expo-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { plan } = await req.json();

    const purchase = await db.purchase.create({
      data: {
        userId,
        plan: plan || "trial",
        status: "trial",
        type: "subscription",
      },
    });

    return NextResponse.json(purchase);
  } catch (error) {
    console.log("[SUBSCRIPTION_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const subscription = await db.purchase.findFirst({
      where: {
        userId,
        type: "subscription",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.log("[SUBSCRIPTION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
