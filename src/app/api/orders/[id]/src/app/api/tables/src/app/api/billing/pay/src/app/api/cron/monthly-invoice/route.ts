import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { logger } from "@/lib/logger"
import { sendWhatsApp, sendSMS, messages } from "@/lib/notifications"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    logger.info("Monthly invoice cron started")

    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const lastMonth = month === 0 ? 11 : month - 1
    const lastMonthYear = month === 0 ? year - 1 : year

    const restaurants = await prisma.restaurant.findMany()

    for (const restaurant of restaurants) {
      logger.info("Processing restaurant", {
        restaurantId: restaurant.id,
        name: restaurant.name,
      })

      const startDate = new Date(lastMonthYear, lastMonth, 1)
      const endDate = new Date(year, month, 1)

      const orders = await prisma.order.findMany({
        where: {
          restaurantId: restaurant.id,
          status: "DELIVERED",
          createdAt: { gte: startDate, lt: endDate },
        },
      })

      const totalOrders = orders.length
      const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
      const commission = totalOrders * parseFloat(process.env.COMMISSION_AMOUNT || "1.0")

      if (totalOrders === 0) continue

      const invoice = await prisma.invoice.create({
        data: {
          restaurantId: restaurant.id,
          month: lastMonth + 1,
          year: lastMonthYear,
          totalOrders,
          totalAmount,
          commission,
          status: "SENT",
          sentAt: new Date(),
        },
      })

      logger.info("Invoice created", {
        restaurantId: restaurant.id,
        invoiceId: invoice.id,
        commission,
      })

      // بعت إيميل
      try {
        await resend.emails.send({
          from: "QResto <billing@qresto.ma>",
          to: restaurant.email,
          subject: `فاتورة QResto - ${lastMonth + 1}/${lastMonthYear}`,
          html: `
            <h1>فاتورة QResto</h1>
            <p>مرحباً ${restaurant.name},</p>
            <p>فاتورة الشهر ${lastMonth + 1}/${lastMonthYear}:</p>
            <ul>
              <li>عدد الطلبات: ${totalOrders}</li>
              <li>المجموع: ${totalAmount} درهم</li>
              <li>العمولة: ${commission} درهم</li>
            </ul>
            <p>الرصيد المستحق: ${restaurant.balanceDue + commission} درهم</p>
            <p>للدفع تواصل معنا: ${process.env.ADMIN_PHONE}</p>
          `,
        })
      } catch (e) {
        logger.error("فشل إرسال الإيميل", { error: e, restaurantId: restaurant.id })
      }

      // بعت WhatsApp
      const restaurantLang = restaurant.language as keyof typeof messages || 'ar'
      const msgTemplate = messages[restaurantLang] || messages.ar
      
      if (restaurant.whatsapp) {
        await sendWhatsApp(
          restaurant.whatsapp,
          msgTemplate.invoiceReady(lastMonth + 1, lastMonthYear, commission)
        )
      }

      // بعت SMS إلا الرصيد فوق 100
      if (restaurant.balanceDue + commission > 100 && restaurant.phone) {
        await sendSMS(
          restaurant.phone,
          msgTemplate.paymentReminder(restaurant.balanceDue + commission)
        )
      }
    }

    logger.info("Monthly invoice cron completed", { processed: restaurants.length })
    return NextResponse.json({ success: true, processed: restaurants.length })
  } catch (error) {
    logger.error("Cron job failed", { error })
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}
