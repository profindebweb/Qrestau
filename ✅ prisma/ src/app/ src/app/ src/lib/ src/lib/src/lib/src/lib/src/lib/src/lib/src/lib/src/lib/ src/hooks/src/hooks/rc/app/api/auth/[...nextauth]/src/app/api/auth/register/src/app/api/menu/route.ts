import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ratelimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const ip = req.ip ?? "127.0.0.1"
    const { success } = await ratelimit.menu.limit(ip)

    if (!success) {
      return NextResponse.json({ error: "زدتي بزاف!" }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const tableId = searchParams.get("tableId")

    if (!tableId) {
      return NextResponse.json({ error: "معرف الطاولة ضروري" }, { status: 400 })
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true },
    })

    if (!table) {
      return NextResponse.json({ error: "الطاولة ماتلقاتش" }, { status: 404 })
    }

    if (!table.restaurant.isActive) {
      logger.warn("محاولة وصول لمنيو مطعم متوقف", { tableId, restaurantId: table.restaurantId })
      return NextResponse.json(
        { error: "الخدمة متوقفة. خلص " + table.restaurant.balanceDue + " درهم" },
        { status: 403 }
      )
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        restaurantId: table.restaurantId,
        isAvailable: true,
      },
      orderBy: { category: 'asc' },
    })

    return NextResponse.json({ menuItems, restaurant: table.restaurant })
  } catch (error) {
    logger.error("خطأ فجلب المنيو", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}

