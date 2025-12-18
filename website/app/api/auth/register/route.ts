import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json()

        if (!email || !password) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const existingUser = await db.user.findFirst({ where: { email, platform: 'SATecosystem' } })
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await db.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                platform: 'SATecosystem',
            },
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("[REGISTER_ERROR]", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
