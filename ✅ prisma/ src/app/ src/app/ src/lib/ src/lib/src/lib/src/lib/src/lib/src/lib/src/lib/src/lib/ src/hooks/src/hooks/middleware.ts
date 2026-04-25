import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/kitchen") || pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // حماية الأدمن
    if (pathname.startsWith("/admin") && token.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  if (pathname.startsWith("/t/")) {
    const tableId = pathname.split("/")[2]
    
    try {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: { restaurant: true },
      })

      if (!table) {
        return NextResponse.redirect(new URL("/not-found", req.url))
      }

      if (!table.restaurant.isActive) {
        return NextResponse.redirect(
          new URL(`/suspended?due=${table.restaurant.balanceDue}`, req.url)
        )
      }

      if (table.restaurant.balanceDue > 100) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        if (!table.restaurant.lastPaymentAt || table.restaurant.lastPaymentAt < thirtyDaysAgo) {
          return NextResponse.redirect(
            new URL(`/suspended?due=${table.restaurant.balanceDue}`, req.url)
          )
        }
      }
    } catch (error) {
      console.error("Middleware error:", error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/kitchen/:path*", "/admin/:path*", "/t/:path*"],
}

