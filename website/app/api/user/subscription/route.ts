import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try{
        const {userId, courseId} = await req.json();

        const subscription = await db.courseSubscription.create({
            data:{
                userId,
                courseId
            }
        });

        return NextResponse.json(subscription);

    }catch(error){
        console.log("[COURSE_SUBSCRIPTION]", error);
        return new NextResponse("Internal Error", {status: 500});
    }
}