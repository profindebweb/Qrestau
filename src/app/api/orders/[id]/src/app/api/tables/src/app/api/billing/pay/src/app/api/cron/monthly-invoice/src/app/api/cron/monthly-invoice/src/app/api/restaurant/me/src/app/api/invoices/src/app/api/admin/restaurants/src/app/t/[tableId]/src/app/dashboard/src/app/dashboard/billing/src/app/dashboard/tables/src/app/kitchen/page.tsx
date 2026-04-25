"use client"

import { useState, useEffect } from "react"
import Pusher from "pusher-js"

type Order = {
  id: string
  table: { number: number }
  items: any[]
  status: string
  createdAt: string
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    fetch("/api/orders?status=NEW,PREPARING")
      .then((res) => res.json())
      .then((data) => setOrders(data))

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe("kitchen-global")
    channel.bind("new-order", (order: Order) => {
      setOrders((prev) => [...prev, order])
    })
    channel.bind("order-status-update", (updated: Order) => {
      setOrders((prev) =>
        prev.filter((o) => o.id !== updated.id || updated.status === "PREPARING")
      )
      if (updated.status === "PREPARING") {
        setOrders((prev) => [...prev, updated])
      }
    })

    return () => {
      pusher.unsubscribe("kitchen-global")
      pusher.disconnect()
    }
  }, [])

  const markReady = async (orderId: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READY" }),
    })
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">🍳 Kitchen Display</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {orders.map((order) => (
          <div key={order.id} className={`p-4 rounded-lg ${order.status === "NEW" ? "bg-red-900" : "bg-orange-900"}`}>
            <div className="flex justify-between mb-2">
              <span className="text-2xl font-bold">Table {order.table.number}</span>
              <span className="text-sm opacity-75">{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="space-y-2 mb-4">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="text-lg">{item.quantity}x {item.menuItemId}</div>
              ))}
            </div>
            <button onClick={() => markReady(order.id)} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold text-lg">
              ✅ Ready
            </button>
          </div>
        ))}
      </div>

      {orders.length === 0 && <div className="text-center text-2xl opacity-50 mt-20">No orders...</div>}
    </div>
  )
}

