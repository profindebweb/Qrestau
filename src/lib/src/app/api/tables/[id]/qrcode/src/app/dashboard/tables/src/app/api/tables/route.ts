import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTableSchema } from "@/lib/zod-schemas"
import { getServerSession } from "next-auth"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ممسموحش" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createTableSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "رقم الطاولة غالط" }, { status: 400 })
    }

    const { number } = parsed.data
    const restaurantId = session.user.id

    // رابط خاص بـ QResto
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const qrCodeUrl = `${baseUrl}/t/${restaurantId}-${number}`

    const table = await prisma.table.create({
      data: {
        number,
        qrCodeUrl,
        restaurantId,
      },
    })

    logger.info("طاولة جديدة مع QR", { 
      tableId: table.id, 
      restaurantId, 
      number,
      qrUrl: qrCodeUrl 
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "هاد الطاولة موجودة من قبل" },
        { status: 409 }
      )
    }
    logger.error("خطأ فإنشاء الطاولة", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ممسموحش" }, { status: 401 })
    }

    const tables = await prisma.table.findMany({
      where: { restaurantId: session.user.id },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { number: 'asc' },
    })

    return NextResponse.json(tables)
  } catch (error) {
    logger.error("خطأ فجلب الطاولات", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}

