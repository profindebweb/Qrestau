"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useCart } from "@/hooks/useCart"
import { useOffline } from "@/hooks/useOffline"
import { getTranslation, type Language } from "@/lib/i18n"
import Pusher from "pusher-js"

type MenuItem = {
  id: string
  name: string
  nameFr?: string
  nameEn?: string
  nameEs?: string
  price: number
  category: string
  image?: string
}

export default function CustomerPage() {
  const { tableId } = useParams()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [restaurant, setRestaurant] = useState<any>(null)
  const [lang, setLang] = useState<Language>("ar")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  
  const { cart, addToCart, removeFromCart, total, clearCart } = useCart()
  const { isOnline } = useOffline()

  const t = getTranslation(lang)

  const getItemName = (item: MenuItem) => {
    switch (lang) {
      case 'fr': return item.nameFr || item.name
      case 'en': return item.nameEn || item.name
      case 'es': return item.nameEs || item.name
      default: return item.name
    }
  }

  useEffect(() => {
    fetch(`/api/menu?tableId=${tableId}`)
      .then((res) => {
        if (res.status === 403) throw new Error("الخدمة متوقفة")
        return res.json()
      })
      .then((data) => {
        setMenuItems(data.menuItems)
        setRestaurant(data.restaurant)
        if (data.restaurant.language) {
          setLang(data.restaurant.language as Language)
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [tableId])

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe(`table-${tableId}`)
    channel.bind("order-status-update", (data: any) => {
      setOrderStatus(data.status)
      if (data.status === "DELIVERED") {
        clearCart()
      }
    })

    return () => {
      pusher.unsubscribe(`table-${tableId}`)
      pusher.disconnect()
    }
  }, [tableId, clearCart])

  const handleOrder = async () => {
    if (cart.length === 0) return

    const orderData = {
      tableId,
      items: cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (res.ok) {
        clearCart()
        setOrderStatus("NEW")
        alert(t.added)
      } else {
        throw new Error("فشل الطلب")
      }
    } catch (err) {
      if (!isOnline) {
        const pending = JSON.parse(localStorage.getItem("pendingOrders") || "[]")
        pending.push(orderData)
        localStorage.setItem("pendingOrders", JSON.stringify(pending))
        alert(t.offline)
      }
    }
  }

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <h1 className="text-xl font-bold">{restaurant?.name}</h1>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="ar">🇲🇦 العربية</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="it">🇮🇹 Italiano</option>
          </select>
        </div>
        {!isOnline && (
          <div className="text-xs text-orange-600 text-center mt-1">
            {t.offline}
          </div>
        )}
      </header>

      <div className="max-w-md mx-auto p-4 pb-32">
        {orderStatus && (
          <div className="mb-4 p-3 bg-blue-100 rounded-lg text-center">
            {t.orderReceived}: {orderStatus}
          </div>
        )}

        <h2 className="text-lg font-semibold mb-3">{t.menu}</h2>
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
              <div>
                <h3 className="font-medium">{getItemName(item)}</h3>
                <p className="text-green-600 font-bold">{item.price} MAD</p>
              </div>
              <button
                onClick={() => addToCart({ id: item.id, name: getItemName(item), price: item.price })}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-md mx-auto">
          <h3 className="font-bold mb-2">{t.cart} ({cart.length})</h3>
          {cart.length > 0 ? (
            <>
              <div className="space-y-1 mb-3 max-h-32 overflow-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500">×</button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">{t.total}: {total} MAD</span>
                <button
                  onClick={handleOrder}
                  disabled={!isOnline && cart.length > 0}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold disabled:bg-gray-400"
                >
                  {t.order}
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">{t.empty}</p>
          )}
        </div>
      </div>
    </div>
  )
}
