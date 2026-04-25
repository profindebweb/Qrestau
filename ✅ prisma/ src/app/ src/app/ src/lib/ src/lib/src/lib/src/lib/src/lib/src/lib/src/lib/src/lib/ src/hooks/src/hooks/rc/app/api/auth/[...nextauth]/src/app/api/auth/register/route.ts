import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema } from "@/lib/zod-schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غالطة" }, { status: 400 })
    }

    const { name, email, password, phone, whatsapp } = parsed.data

    const existing = await prisma.restaurant.findFirst({
      where: { OR: [{ email }, { phone }] },
    })

    if (existing) {
      return NextResponse.json({ error: "الإيميل أو الهاتف مستعمل من قبل" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        whatsapp: whatsapp || phone,
      },
    })

    return NextResponse.json(
      { message: "تم التسجيل", id: restaurant.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("خطأ فالتسجيل:", error)
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}

