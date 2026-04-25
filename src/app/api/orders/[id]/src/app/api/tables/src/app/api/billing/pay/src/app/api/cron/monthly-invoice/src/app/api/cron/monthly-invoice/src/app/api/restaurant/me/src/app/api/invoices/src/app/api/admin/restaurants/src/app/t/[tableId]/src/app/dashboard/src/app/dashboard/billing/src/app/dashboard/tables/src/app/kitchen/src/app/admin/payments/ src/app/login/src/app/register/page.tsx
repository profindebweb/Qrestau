"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    whatsapp: "",
  })
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      router.push("/login")
    } else {
      setError(data.error || "خطأ فالتسجيل")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">تسجيل مطعم جديد</h1>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="اسم المطعم" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" required />
          <input placeholder="رقم الهاتف" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="w-full border p-2 rounded" required />
          <input placeholder="رقم الواتساب (اختياري)" value={form.whatsapp} onChange={(e) => setForm({...form, whatsapp: e.target.value})} className="w-full border p-2 rounded" />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold">سجل</button>
        </form>
      </div>
    </div>
  )
}

