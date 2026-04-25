"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getTranslation, type Language } from "@/lib/i18n"
import Pusher from "pusher-js"

type Order = {
  id: string
  status: string
  totalAmount: number
  table: { number: number }
  items: any[]
  createdAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [restaurant, setRestaurant] = useState<any>(null)
  const [stats, setStats] = useState({ today: 0, month: 0, balance: 0 })
  const [lang, setLang] = useState<Language>("ar")

  const t = getTranslation(lang)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (!session?.user?.id) return
    
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data))

    fetch("/api/restaurant/me")
      .then((res) => res.json())
      .then((data) => {
        setRestaurant(data)
        setLang(data.language as Language || "ar")
        setStats({
          today: data.todayOrders || 0,
          month: data.monthOrders || 0,
          balance: data.balanceDue || 0,
        })
      })

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe(`restaurant-${session.user.id}`)
    channel.bind("new-order", (order: Order) => {
      setOrders((prev) => [order, ...prev])
    })
    channel.bind("order-status-update", (updated: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      )
    })

    return () => {
      pusher.unsubscribe(`restaurant-${session.user.id}`)
      pusher.disconnect()
    }
  }, [session])

  const moveOrder = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW": return t.new
      case "PREPARING": return t.preparing
      case "READY": return t.ready
      case "DELIVERED": return t.delivered
      default: return status
    }
  }

  if (status === "loading") return <div>جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {stats.balance > 50 && (
        <div className="bg-red-100 border-l-4 border-red-600 p-4 mb-4 rounded">
          <p className="text-red-700 font-bold">
            ⚠️ {t.balance}: {stats.balance} MAD - 
            <button 
              onClick={() => router.push("/dashboard/billing")}
              className="underline ml-2"
            >
              {t.payNow}
            </button>
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600 text-sm">{t.today}</p>
          <p className="text-2xl font-bold">{stats.today}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600 text-sm">{t.thisMonth}</p>
          <p className="text-2xl font-bold">{stats.month}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600 text-sm">{t.balance}</p>
          <p className="text-2xl font-bold text-red-600">{stats.balance} MAD</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 overflow-x-auto">
        {["NEW", "PREPARING", "READY", "DELIVERED"].map((col) => (
          <div key={col} className="bg-gray-200 rounded-lg p-3 min-w-[250px]">
            <h3 className="font-bold mb-3 text-center">{getStatusLabel(col)}</h3>
            <div className="space-y-2">
              {orders
                .filter((o) => o.status === col)
                .map((order) => (
                  <div key={order.id} className="bg-white p-3 rounded shadow">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold">{t.table} {order.table.number}</span>
                      <span className="text-sm text-gray-500">{order.totalAmount} MAD</span>
                    </div>
                    {col !== "DELIVERED" && (
                      <div className="flex gap-1">
                        {col === "NEW" && (
                          <button onClick={() => moveOrder(order.id, "PREPARING")} className="flex-1 bg-blue-500 text-white text-xs py-1 rounded">
                            {t.preparing}
                          </button>
                        )}
                        {col === "PREPARING" && (
                          <button onClick={() => moveOrder(order.id, "READY")} className="flex-1 bg-orange-500 text-white text-xs py-1 rounded">
                            {t.ready}
                          </button>
                        )}
                        {col === "READY" && (
                          <button onClick={() => moveOrder(order.id, "DELIVERED")} className="flex-1 bg-green-500 text-white text-xs py-1 rounded">
                            {t.delivered}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

