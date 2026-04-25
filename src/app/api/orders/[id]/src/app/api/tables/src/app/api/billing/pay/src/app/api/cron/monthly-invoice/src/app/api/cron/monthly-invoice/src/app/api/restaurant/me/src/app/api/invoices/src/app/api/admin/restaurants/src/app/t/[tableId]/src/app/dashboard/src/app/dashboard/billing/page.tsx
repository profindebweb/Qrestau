"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getTranslation, type Language } from "@/lib/i18n"

type Invoice = {
  id: string
  month: number
  year: number
  totalOrders: number
  commission: number
  status: string
  createdAt: string
}

export default function BillingPage() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState(0)
  const [paid, setPaid] = useState(0)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [lang, setLang] = useState<Language>("ar")

  const t = getTranslation(lang)

  useEffect(() => {
    if (!session?.user?.id) return
    
    fetch("/api/restaurant/me")
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balanceDue)
        setPaid(data.commissionPaid)
        setLang(data.language as Language || "ar")
      })

    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data))
  }, [session])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">{t.billing}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">{t.balance}</p>
            <p className="text-3xl font-bold text-red-600">{balance.toFixed(2)} MAD</p>
          </div>
          <div>
            <p className="text-gray-600">المدفوع</p>
            <p className="text-3xl font-bold text-green-600">{paid.toFixed(2)} MAD</p>
          </div>
        </div>
        
        {balance > 100 && (
          <div className="mt-4 p-3 bg-red-100 rounded">
            <p className="text-red-700 font-bold">⚠️ الرصيد فوق 100 درهم!</p>
            <p className="text-sm text-red-600 mt-1">
              للدفع تواصل معنا: <strong>{process.env.NEXT_PUBLIC_ADMIN_PHONE}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-right">الشهر</th>
              <th className="p-3 text-right">{t.orders}</th>
              <th className="p-3 text-right">العمولة</th>
              <th className="p-3 text-right">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="p-3">{inv.month}/{inv.year}</td>
                <td className="p-3">{inv.totalOrders}</td>
                <td className="p-3">{inv.commission} MAD</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${
                    inv.status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {inv.status === "PAID" ? "✅" : "⏳"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

