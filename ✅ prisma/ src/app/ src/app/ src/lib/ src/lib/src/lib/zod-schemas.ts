import { z } from 'zod'

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const createOrderSchema = z.object({
  tableId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
})

export const updateOrderSchema = z.object({
  status: z.enum(["NEW", "PREPARING", "READY", "DELIVERED", "CANCELLED"]),
})

export const createTableSchema = z.object({
  number: z.number().int().min(1),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(10),
  whatsapp: z.string().optional(),
})

