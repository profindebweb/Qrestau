import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateOrderSchema } from "@/lib/zod-schemas"
import { getServerSession } from "next-auth"
import { pusherServer } from "@/lib/pusher"
import { logger } from "@/lib/logger"
import { sendWhatsApp, messages } from "@/lib/notifications"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ممسموحش" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = updateOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "حالة غالطة" }, { status: 400 })
    }

    const { status } = parsed.data
    const orderId = params.id

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true, commission: true, table: true },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "الطلب ماتلقاش" }, { status: 404 })
    }

    if (existingOrder.restaurantId !== session.user.id) {
      logger.warn("محاولة IDOR!", { 
        attackerId: session.user.id, 
        ownerId: existingOrder.restaurantId,
        orderId 
      })
      return NextResponse.json({ error: "ماشي ديالك" }, { status: 403 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true, table: true },
    })

    if (status === "DELIVERED" && !existingOrder.commission) {
      const commissionAmount = parseFloat(process.env.COMMISSION_AMOUNT || "1.0")

      await prisma.$transaction([
        prisma.commission.create({
          data: {
            amount: commissionAmount,
            orderId: orderId,
            restaurantId: existingOrder.restaurantId,
            status: "PENDING",
          },
        }),
        prisma.restaurant.update({
          where: { id: existingOrder.restaurantId },
          data: {
            balanceDue: { increment: commissionAmount },
          },
        }),
      ])

      logger.info("عمولة مسجلة", { 
        orderId, 
        restaurantId: existingOrder.restaurantId, 
        amount: commissionAmount 
      })
    }

    // بعت WhatsApp للزبون منين الطلب يكون جاهز
    if (status === "READY" && existingOrder.restaurant.whatsapp) {
      const restaurantLang = existingOrder.restaurant.language as keyof typeof messages || 'ar'
      const msgTemplate = messages[restaurantLang] || messages.ar
      
      await sendWhatsApp(
        existingOrder.restaurant.whatsapp,
        msgTemplate.orderReady(existingOrder.table.number)
      )
    }

    try {
      await pusherServer.trigger(
        `restaurant-${existingOrder.restaurantId}`,
        "order-status-update",
        updatedOrder
      )
    } catch (e) {
      logger.error("Pusher error", { error: e })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    logger.error("خطأ فتحديث الطلب", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}
