import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession()
  
  if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "غير مسموح" }, { status: 403 })
  }

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { balanceDue: "desc" },
  })

  return NextResponse.json(restaurants)
}

