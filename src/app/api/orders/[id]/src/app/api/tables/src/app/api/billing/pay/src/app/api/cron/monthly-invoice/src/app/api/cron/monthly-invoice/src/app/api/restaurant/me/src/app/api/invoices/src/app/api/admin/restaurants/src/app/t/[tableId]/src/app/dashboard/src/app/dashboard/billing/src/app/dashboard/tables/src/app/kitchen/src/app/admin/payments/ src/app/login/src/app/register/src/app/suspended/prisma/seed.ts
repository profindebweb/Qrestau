import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  await prisma.orderItem.deleteMany()
  await prisma.commission.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.table.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.restaurant.deleteMany()

  const password = await bcrypt.hash("demo1234", 10)
  
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Café Alaoui Demo",
      email: "demo@alaoui.ma",
      password,
      phone: "0612345678",
      whatsapp: "0612345678",
      language: "ar",
      isActive: true,
      balanceDue: 0,
      prepaidBalance: 100,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  
  for (let i = 1; i <= 3; i++) {
    await prisma.table.create({
      data: {
        number: i,
        qrCodeUrl: `${baseUrl}/t/${restaurant.id}-${i}`,
        restaurantId: restaurant.id,
      },
    })
  }

  const menuItems = [
    { name: "طاجين لحم", nameFr: "Tajine de viande", nameEn: "Meat Tajine", nameEs: "Tajín de carne", price: 45, category: "MAIN", image: "/tajine.jpg" },
    { name: "أتاي", nameFr: "Thé à la menthe", nameEn: "Mint Tea", nameEs: "Té de menta", price: 10, category: "DRINK", image: "/atai.jpg" },
    { name: "قهوة", nameFr: "Café", nameEn: "Coffee", nameEs: "Café", price: 12, category: "DRINK", image: "/coffee.jpg" },
    { name: "بيتزا", nameFr: "Pizza", nameEn: "Pizza", nameEs: "Pizza", price: 60, category: "MAIN", image: "/pizza.jpg" },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: { ...item, restaurantId: restaurant.id },
    })
  }

  console.log("✅ Seed completed!")
  console.log("📧 Login: demo@alaoui.ma / demo1234")
  console.log("🔗 QR Code Table 1:", `${baseUrl}/t/${restaurant.id}-1`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

