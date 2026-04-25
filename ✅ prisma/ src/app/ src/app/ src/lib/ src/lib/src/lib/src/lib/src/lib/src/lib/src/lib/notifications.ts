// هاد الملف كيبعت SMS و WhatsApp

import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// بعت SMS
export async function sendSMS(to: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to.startsWith('+') ? to : `+212${to.replace(/^0/, '')}`,
    })
    return true
  } catch (error) {
    console.error('SMS error:', error)
    return false
  }
}

// بعت WhatsApp (بـ Twilio)
export async function sendWhatsApp(to: string, message: string) {
  try {
    await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+212${to.replace(/^0/, '')}`,
    })
    return true
  } catch (error) {
    console.error('WhatsApp error:', error)
    return false
  }
}

// رسائل جاهزة
export const messages = {
  ar: {
    newOrder: (table: number, total: number) => 
      `🍽️ طلب جديد!\nطاولة: ${table}\nالمجموع: ${total} درهم\nQResto`,
    orderReady: (table: number) => 
      `✅ الطلب جاهز!\nطاولة: ${table}\nQResto`,
    paymentReminder: (balance: number) => 
      `⚠️ تذكير بالدفع\nالرصيد المستحق: ${balance} درهم\nتواصل معنا: ${process.env.ADMIN_PHONE}\nQResto`,
    invoiceReady: (month: number, year: number, amount: number) => 
      `📄 فاتورة ${month}/${year}\nالمبلغ: ${amount} درهم\nQResto`,
  },
  fr: {
    newOrder: (table: number, total: number) => 
      `🍽️ Nouvelle commande!\nTable: ${table}\nTotal: ${total} MAD\nQResto`,
    orderReady: (table: number) => 
      `✅ Commande prête!\nTable: ${table}\nQResto`,
    paymentReminder: (balance: number) => 
      `⚠️ Rappel de paiement\nSolde dû: ${balance} MAD\nContact: ${process.env.ADMIN_PHONE}\nQResto`,
    invoiceReady: (month: number, year: number, amount: number) => 
      `📄 Facture ${month}/${year}\nMontant: ${amount} MAD\nQResto`,
  },
  en: {
    newOrder: (table: number, total: number) => 
      `🍽️ New Order!\nTable: ${table}\nTotal: ${total} MAD\nQResto`,
    orderReady: (table: number) => 
      `✅ Order Ready!\nTable: ${table}\nQResto`,
    paymentReminder: (balance: number) => 
      `⚠️ Payment Reminder\nBalance Due: ${balance} MAD\nContact: ${process.env.ADMIN_PHONE}\nQResto`,
    invoiceReady: (month: number, year: number, amount: number) => 
      `📄 Invoice ${month}/${year}\nAmount: ${amount} MAD\nQResto`,
  },
  es: {
    newOrder: (table: number, total: number) => 
      `🍽️ ¡Nuevo Pedido!\nMesa: ${table}\nTotal: ${total} MAD\nQResto`,
    orderReady: (table: number) => 
      `✅ ¡Pedido Listo!\nMesa: ${table}\nQResto`,
    paymentReminder: (balance: number) => 
      `⚠️ Recordatorio de Pago\nSaldo: ${balance} MAD\nContacto: ${process.env.ADMIN_PHONE}\nQResto`,
    invoiceReady: (month: number, year: number, amount: number) => 
      `📄 Factura ${month}/${year}\nMonto: ${amount} MAD\nQResto`,
  },
}

