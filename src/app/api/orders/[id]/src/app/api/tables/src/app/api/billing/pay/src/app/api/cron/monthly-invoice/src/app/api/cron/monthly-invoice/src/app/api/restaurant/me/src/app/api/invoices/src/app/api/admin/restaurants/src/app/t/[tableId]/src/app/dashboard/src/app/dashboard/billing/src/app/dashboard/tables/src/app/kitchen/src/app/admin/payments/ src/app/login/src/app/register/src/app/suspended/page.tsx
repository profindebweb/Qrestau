"use client"

import { useSearchParams } from "next/navigation"

export default function SuspendedPage() {
  const searchParams = useSearchParams()
  const due = searchParams.get("due") || "0"

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-red-600 mb-4">الخدمة متوقفة</h1>
        <p className="text-gray-600 mb-4">المطعم مقطوع عليه بسبب عدم الدفع.</p>
        <div className="bg-red-100 p-4 rounded mb-4">
          <p className="font-bold">المبلغ المستحق: {due} MAD</p>
        </div>
        <p className="text-sm text-gray-500">تواصل مع إدارة QResto للتفعيل</p>
      </div>
    </div>
  )
}
