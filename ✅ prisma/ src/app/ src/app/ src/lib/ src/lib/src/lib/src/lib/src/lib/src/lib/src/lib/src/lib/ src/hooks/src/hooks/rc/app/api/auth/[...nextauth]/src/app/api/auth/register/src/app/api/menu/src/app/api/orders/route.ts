import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createOrderSchema } from "@/lib/zod-schemas"
import { getServerSession } from "next-auth"
import { pusherServer } from "@/lib/pusher"
import { ratelimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"
import { sendWhatsApp, sendSMS, messages } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? "127.0.0.1"
    const { success } = await ratelimit.order.limit(ip)

    if (!success) {
      return NextResponse.json({ error: "زدتي بزاف! جرب بعد شي دقايق." }, { status: 429 })
    }

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غالطة", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { tableId, items } = parsed.data

    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: { restaurant: true },
    })

    if (!table) {
      return NextResponse.json({ error: "الطاولة ماتلقاتش" }, { status: 404 })
    }

    if (!table.restaurant.isActive) {
      return NextResponse.json({ error: "الخدمة متوقفة" }, { status: 403 })
    }

    if (table.restaurant.prepaidBalance <= 0 && table.restaurant.balanceDue > 50) {
      return NextResponse.json(
        { error: "المطعم مقطوع عليه، مايمكنش تطلب حالياً" },
        { status: 403 }
      )
    }

    const menuItemIds = items.map((item) => item.menuItemId)
    const menuItemsFromDB = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: table.restaurantId,
        isAvailable: true,
      },
    })

    const priceMap = new Map(menuItemsFromDB.map((item) => [item.id, item.price]))

    let calculatedTotal = 0
    const validatedItems = []

    for (const item of items) {
      const realPrice = priceMap.get(item.menuItemId)
      
      if (realPrice === undefined) {
        logger.warn("محاولة طلب طبق غير موجود", { menuItemId: item.menuItemId, tableId })
        return NextResponse.json(
          { error: `الطبق ماتلقاش أو ماشي متاح` },
          { status: 400 }
        )
      }

      calculatedTotal += realPrice * item.quantity
      
      validatedItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: realPrice,
      })
    }

    const order = await prisma.order.create({
      data: {
        tableId,
        restaurantId: table.restaurantId,
        totalAmount: calculatedTotal,
        status: "NEW",
        items: {
          create: validatedItems,
        },
      },
      include: {
        items: true,
        table: true,
      },
    })

    logger.info("طلب جديد", { orderId: order.id, restaurantId: table.restaurantId, amount: calculatedTotal })

    // بعت WhatsApp للمطعم
    const restaurantLang = table.restaurant.language as keyof typeof messages || 'ar'
    const msgTemplate = messages[restaurantLang] || messages.ar
    
    if (table.restaurant.whatsapp) {
      await sendWhatsApp(
        table.restaurant.whatsapp,
        msgTemplate.newOrder(table.number, calculatedTotal)
      )
    }

    try {
      await pusherServer.trigger(`restaurant-${table.restaurantId}`, "new-order", order)
    } catch (e) {
      logger.error("Pusher error", { error: e })
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    logger.error("خطأ فإنشاء الطلب", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ممسموحش" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where: any = { restaurantId: session.user.id }
    if (status) {
      const statuses = status.split(",")
      where.status = { in: statuses }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
        table: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(orders)
  } catch (error) {
    logger.error("خطأ فجلب الطلبات", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}

