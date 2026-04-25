"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { QRCodeSVG } from "qrcode.react"
import jsPDF from "jspdf"

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

  const downloadPDF = () => {
    const pdf = new jsPDF()
    tables.forEach((table, i) => {
      if (i > 0) pdf.addPage()
      pdf.setFontSize(20)
      pdf.text(`Table ${table.number}`, 105, 20, { align: "center" })
      pdf.setFontSize(12)
      pdf.text("Scan to order", 105, 30, { align: "center" })
      pdf.text(table.qrCodeUrl, 105, 280, { align: "center" })
    })
    pdf.save("qr-codes.pdf")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>

      <div className="bg-white p-4 rounded shadow mb-6 flex gap-2">
        <input
          type="number"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
          placeholder="Table number"
          className="border p-2 rounded flex-1"
        />
        <button onClick={addTable} className="bg-blue-600 text-white px-4 py-2 rounded">+ Add</button>
      </div>

      <button onClick={downloadPDF} className="bg-green-600 text-white px-4 py-2 rounded mb-6">
        📄 Download QR Codes PDF
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div key={table.id} className="bg-white p-4 rounded shadow text-center">
            <h3 className="font-bold mb-2">Table {table.number}</h3>
            <div className="mb-2 flex justify-center">
              <QRCodeSVG value={table.qrCodeUrl} size={120} />
            </div>
            <p className="text-sm text-gray-600 mb-2">{table._count.orders} orders</p>
            <a href={table.qrCodeUrl} target="_blank" className="text-blue-600 text-sm underline">Open</a>
          </div>
        ))}
      </div>
    </div>
  )
}

