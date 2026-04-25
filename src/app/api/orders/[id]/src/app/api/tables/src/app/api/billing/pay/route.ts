import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "غير مسموح - غير الأدمن" }, { status: 403 })
    }

    const body = await req.json()
    const { restaurantId, amount, note } = body

    if (!restaurantId || !amount || amount <= 0) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json({ error: "المطعم ماتلقاش" }, { status: 404 })
    }

    const newBalance = Math.max(0, restaurant.balanceDue - amount)

    await prisma.$transaction([
      prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          balanceDue: newBalance,
          commissionPaid: { increment: amount },
          lastPaymentAt: new Date(),
          isActive: newBalance <= 100,
        },
      }),
      prisma.commission.updateMany({
        where: { 
          restaurantId, 
          status: "PENDING" 
        },
        data: { 
          status: "PAID",
          paidAt: new Date(),
        },
      }),
    ])

    logger.info("دفع كاش مسجل", {
      restaurantId,
      amount,
      admin: session.user.email,
      note,
      newBalance,
    })

    return NextResponse.json({ 
      success: true, 
      message: `تم تسجيل دفع ${amount} درهم. الرصيد الجديد: ${newBalance} درهم` 
    })

  } catch (error) {
    logger.error("خطأ فتسجيل الدفع", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}
