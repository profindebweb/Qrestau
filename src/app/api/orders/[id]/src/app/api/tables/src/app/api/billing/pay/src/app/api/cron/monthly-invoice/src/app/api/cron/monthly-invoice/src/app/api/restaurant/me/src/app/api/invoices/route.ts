import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const invoices = await prisma.invoice.findMany({
    where: { restaurantId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(invoices)
}

