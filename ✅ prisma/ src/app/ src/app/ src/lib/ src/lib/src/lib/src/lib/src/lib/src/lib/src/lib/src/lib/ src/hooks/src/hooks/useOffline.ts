import { useState, useEffect, useCallback } from "react"

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const syncPendingOrders = useCallback(async () => {
    const pending = JSON.parse(localStorage.getItem("pendingOrders") || "[]")
    if (pending.length === 0) return

    for (const order of pending) {
      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        })
      } catch (e) {
        console.error("فشل تصيفط طلب معلق:", e)
      }
    }

    localStorage.removeItem("pendingOrders")
  }, [])

  useEffect(() => {
    if (isOnline) {
      syncPendingOrders()
    }
  }, [isOnline, syncPendingOrders])

  return { isOnline, syncPendingOrders }
}
