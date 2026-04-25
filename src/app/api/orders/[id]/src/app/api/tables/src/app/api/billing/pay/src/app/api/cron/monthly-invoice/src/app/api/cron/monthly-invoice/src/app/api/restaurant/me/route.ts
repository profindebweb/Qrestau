import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.id },
  })

  if (!restaurant) {
    return NextResponse.json({ error: "ماتلقاش" }, { status: 404 })
  }

  return NextResponse.json(restaurant)
}

