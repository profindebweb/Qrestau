// هاد الـ API كيولد QR Code PNG تقدر تحملو

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateQRCodeBuffer } from "@/lib/qrcode-generator"
import { getServerSession } from "next-auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ممسموحش" }, { status: 401 })
    }

    const table = await prisma.table.findUnique({
      where: { id: params.id },
    })

    if (!table || table.restaurantId !== session.user.id) {
      return NextResponse.json({ error: "ماتلقاش" }, { status: 404 })
    }

    // تولد QR Code PNG
    const buffer = await generateQRCodeBuffer(table.qrCodeUrl)

    // رجع الصورة
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qresto-table-${table.number}.png"`,
      },
    })

  } catch (error) {
    console.error("خطأ:", error)
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 })
  }
}
