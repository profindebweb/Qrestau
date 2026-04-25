import { useState, useCallback } from "react"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = useCallback((item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return { cart, addToCart, removeFromCart, clearCart, total }
}

