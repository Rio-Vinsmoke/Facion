import type { Product } from '../types/product'
import type { CartItem } from '../types/cart'

const CART_KEY = 'facion-cart-v1'

export function loadCart(products: Product[]): CartItem[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(CART_KEY) ?? '[]',
    )

    if (!Array.isArray(stored)) return []

    const cart: CartItem[] = []

    for (const entry of stored) {
      if (!entry || typeof entry !== 'object') continue

      const { productId, size, quantity } = entry as Record<string, unknown>

      if (
        typeof productId !== 'string' ||
        typeof size !== 'string' ||
        size.trim().length === 0 ||
        size.length > 20 ||
        typeof quantity !== 'number' ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 10
      ) {
        continue
      }

      const product = products.find(item => item.id === productId)
      if (!product) continue

      const existing = cart.find(
        item => item.product.id === productId && item.size === size,
      )

      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, 10)
      } else {
        cart.push({ product, size, quantity })
      }
    }

    return cart
  } catch {
    return []
  }
}

export function saveCart(cart: CartItem[]): boolean {
  try {
    localStorage.setItem(
      CART_KEY,
      JSON.stringify(
        cart.map(item => ({
          productId: item.product.id,
          size: item.size,
          quantity: item.quantity,
        })),
      ),
    )

    return true
  } catch {
    return false
  }
}