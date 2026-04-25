"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type Restaurant = {
  id: string
  name: string
  phone: string
  balanceDue: number
  commissionPaid: number
  isActive: boolean
}

export default function AdminPaymentsPage() {
  const { data: session } = useSession()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data))
  }, [])

  const handlePayment = async () => {
    if (!selectedRestaurant || !amount) return
    setLoading(true)

    try {
      const res = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: selectedRestaurant,
          amount: parseFloat(amount),
          note,
        }),
      })

      const data = await res.json()
      setMessage(data.message || data.error)
      
      const updated = await fetch("/api/admin/restaurants")
      setRestaurants(await updated.json())
      
      setAmount("")
      setNote("")
    } catch (error) {
      setMessage("خطأ فالدفع")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">💰 تسجيل الدفعات الكاش</h1>

      {message && <div className="bg-green-100 p-3 rounded mb-4 text-green-800">{message}</div>}

      <div className="bg-white rounded shadow overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-right">المطعم</th>
              <th className="p-3 text-right">الهاتف</th>
              <th className="p-3 text-right">الرصيد</th>
              <th className="p-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className={`border-t ${selectedRestaurant === r.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedRestaurant(r.id)}>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.phone}</td>
                <td className="p-3 font-bold text-red-600">{r.balanceDue} MAD</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {r.isActive ? "نشط" : "متوقف"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">تسجيل دفع جديد</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">المبلغ (MAD)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border p-2 rounded" placeholder="مثلاً: 50" />
          </div>
          <div>
            <label className="block text-sm mb-1">ملاحظة</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full border p-2 rounded" placeholder="مثلاً: دفع شهر يناير" />
          </div>
          <button onClick={handlePayment} disabled={loading || !selectedRestaurant || !amount} className="w-full bg-green-600 text-white py-3 rounded font-bold disabled:bg-gray-400">
            {loading ? "جاري التسجيل..." : "✅ سجل الدفع"}
          </button>
        </div>
      </div>
    </div>
  )
}

