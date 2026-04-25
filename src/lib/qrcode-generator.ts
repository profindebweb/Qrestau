// هاد الملف كيتولد QR Code خاص بـ QResto
// كل QR Code فيه: رابط المطعم + رقم الطاولة + لوجو QResto

import QRCode from "qrcode"

export async function generateQRCodeImage(url: string): Promise<string> {
  try {
    // تولد QR Code PNG بجودة عالية
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 600,           // جودة عالية للطباعة
      margin: 2,            // هامش صغير
      color: {
        dark: "#1a365d",    // أزرق داكن (لون QResto)
        light: "#ffffff",   // خلفية بيضاء
      },
      errorCorrectionLevel: "H", // أعلى مستوى تصحيح (حتى إلا QR تخرب شوية كيقرا)
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error("خطأ فتوليد QR:", error)
    throw error
  }
}

// تولد QR Code للتحميل المباشر
export async function generateQRCodeBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: 600,
    margin: 2,
    color: {
      dark: "#1a365d",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  })
}
