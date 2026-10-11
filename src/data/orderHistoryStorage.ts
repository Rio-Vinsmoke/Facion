import { supabase } from '../lib/supabase'
import type { DeliveryAddress } from '../types/address'

export type OrderItem = {
  productId: string
  name: string
  image: string
  size: string
  quantity: number
  price: number
}

export type SavedOrder = {
  id: string
  items: OrderItem[]
  deliveryAddress: DeliveryAddress & { country: string }
  subtotal: number
  status: 'test_placed'
  createdAt: string
}

type OrderRow = {
  id: string
  items: OrderItem[]
  delivery_address: SavedOrder['deliveryAddress']
  subtotal: number
  status: SavedOrder['status']
  created_at: string
}

export async function fetchOrderHistory(
  userId: string,
): Promise<SavedOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      items,
      delivery_address,
      subtotal,
      status,
      created_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<OrderRow[]>()

  if (error) throw error

  return (data ?? []).map(order => ({
    id: order.id,
    items: order.items,
    deliveryAddress: order.delivery_address,
    subtotal: order.subtotal,
    status: order.status,
    createdAt: order.created_at,
  }))
}