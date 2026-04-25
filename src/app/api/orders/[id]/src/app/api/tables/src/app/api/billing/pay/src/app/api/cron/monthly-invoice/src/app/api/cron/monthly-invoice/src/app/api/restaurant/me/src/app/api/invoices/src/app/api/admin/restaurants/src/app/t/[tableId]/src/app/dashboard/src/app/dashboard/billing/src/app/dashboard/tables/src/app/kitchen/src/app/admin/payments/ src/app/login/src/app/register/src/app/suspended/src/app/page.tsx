import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-6">QResto 🍽️</h1>
        <p className="text-xl mb-8">نظام QR Code للمطاعم. ربحي = 1 درهم على كل طلب.</p>
        <div className="space-x-4">
          <Link href="/login" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold">دخول</Link>
          <Link href="/register" className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-bold">سجل مطعمك</Link>
        </div>
      </div>
    </div>
  )
}

