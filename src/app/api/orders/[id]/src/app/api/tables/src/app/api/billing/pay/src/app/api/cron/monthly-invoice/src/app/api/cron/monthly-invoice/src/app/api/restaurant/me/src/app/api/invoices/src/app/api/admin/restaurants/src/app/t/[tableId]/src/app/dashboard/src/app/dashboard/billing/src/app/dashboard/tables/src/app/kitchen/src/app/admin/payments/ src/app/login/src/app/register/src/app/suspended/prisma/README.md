# QResto SaaS 🍽️

نظام QR Code للمطاعم بـ 6 لغات. ربحي = 1 درهم على كل طلب.

## المميزات
- ✅ 6 لغات: عربي، فرنسي، إنجليزي، إسبانيولي، ألماني، إيطالي
- ✅ WhatsApp + SMS notifications
- ✅ PWA (يعمل offline)
- ✅ Real-time updates (Pusher)
- ✅ كاش payments (بدون Stripe)
- ✅ Admin dashboard للتحكم

## التركيب

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
