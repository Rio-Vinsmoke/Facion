import type { Product } from './product'

export type CartItem = {
  product: Product
  size: string
  quantity: number
}