"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { QRCodeSVG } from "qrcode.react"

type Table = {
  id: string
  number: number
  qrCodeUrl: string
  _count: { orders: number }
}

export default function TablesPage() {
  const { data: session } = useSession()
  const [tables, setTables] = useState<Table[]>([])
  const [newNumber, setNewNumber] = useState("")
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/tables")
      .then((res) => res.json())
      .then((data) => setTables(data))
  }, [session])

  const addTable = async () => {
    const num = parseInt(newNumber)
    if (!num) return

    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: num }),
    })

    if (res.ok) {
      const table = await res.json()
      setTables([...tables, table])
      setNewNumber("")
    }
  }

  // تحميل QR Code PNG
  const downloadQR = async (tableId: string, number: number) => {
    setDownloading(tableId)
    try {
      const res = await fetch(`/api/tables/${tableId}/qrcode`)
      const blob = await res.blob()
      
      // كريي رابط تحميل
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qresto-table-${number}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert("فشل التحميل")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">إدارة الطاولات</h1>

      {/* إضافة طاولة */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-2">
        <input
          type="number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          placeholder="رقم الطاولة"
          className="border p-2 rounded flex-1"
        />
        <button
          onClick={addTable}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + أضف
        </button>
      </div>

      {/* قائمة الطاولات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-white p-6 rounded shadow text-center">
            <h3 className="font-bold text-xl mb-4">طاولة {table.number}</h3>
            
            {/* QR Code SVG (للعرض) */}
            <div className="mb-4 flex justify-center bg-gray-50 p-4 rounded">
              <QRCodeSVG 
                value={table.qrCodeUrl} 
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: "/qresto-logo.png",  // لوجو فالوسط
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            {/* معلومات */}
            <p className="text-sm text-gray-600 mb-2">
              {table._count.orders} طلبات
            </p>
            <p className="text-xs text-gray-400 mb-4 break-all">
              {table.qrCodeUrl}
            </p>

            {/* أزرار */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => downloadQR(table.id, table.number)}
                disabled={downloading === table.id}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:bg-gray-400"
              >
                {downloading === table.id ? "جاري..." : "⬇️ تحميل PNG"}
              </button>
              
              <a
                href={table.qrCodeUrl}
                target="_blank"
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
              >
                🔗 فتح
              </a>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center text-gray-500 mt-10">
          ماكاين حتى طاولة. أضف وحدة!
        </div>
      )}
    </div>
  )
}

