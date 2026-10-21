import { supabase } from '../lib/supabase'
import type { CartItem } from '../types/cart'

type OrderRequest = {
  signature: string
  requestId: string
}

function requestKey(userId: string): string {
  return `facion-order-request-v1-${userId}`
}

function getOrderRequest(
  userId: string,
  signature: string,
): string {
  const key = requestKey(userId)
  let existing: unknown

  try {
    const stored = localStorage.getItem(key)
    existing = stored ? JSON.parse(stored) : null
  } catch {
    existing = null
  }

  if (
    existing &&
    typeof existing === 'object' &&
    'signature' in existing &&
    'requestId' in existing &&
    existing.signature === signature &&
    typeof existing.requestId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      existing.requestId,
    )
  ) {
    return existing.requestId
  }

  const request: OrderRequest = {
    signature,
    requestId: crypto.randomUUID(),
  }

  try {
    localStorage.setItem(key, JSON.stringify(request))
  } catch {
    throw new Error(
      'Your browser could not save the order request. Enable browser storage before placing an order.',
    )
  }

  return request.requestId
}

export async function placeTestOrder(
  userId: string,
  items: CartItem[],
): Promise<string> {
  if (items.length === 0) {
    throw new Error('Your bag is empty.')
  }

  const orderItems = items
    .map(item => ({
      productId: item.product.id,
      size: item.size,
      quantity: item.quantity,
    }))
    .sort((first, second) =>
      first.productId.localeCompare(second.productId) ||
      first.size.localeCompare(second.size),
    )

  const signature = JSON.stringify(orderItems)
  const requestId = getOrderRequest(userId, signature)

  const { data, error } = await supabase.rpc('place_test_order', {
    p_request_id: requestId,
    p_items: orderItems,
  })

  if (error) throw error

  if (typeof data !== 'string') {
    throw new Error(
      'Could not confirm the order. Retry with the same bag to check its result.',
    )
  }

  return data
}

export function clearOrderRequest(userId: string): void {
  try {
    localStorage.removeItem(requestKey(userId))
  } catch {
    // Retaining the request helps prevent duplicate orders on retry.
  }
}