
import { supabase } from '../lib/supabase'
import type { Product, ProductVariant } from '../types/product'

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      gender,
      price,
      image,
      cutout_image,
      variants:product_variants(size, stock)
    `)
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map(product => ({
    ...product,
    cutout_image: product.cutout_image ?? null,
  })) as Product[]
}

export function getSizeStock(
  product: Product,
  size: string,
): number {
  return product.variants?.find(
    variant => variant.size === size,
  )?.stock ?? 0
}

export function getSortedVariants(
  product: Product,
): ProductVariant[] {
  const clothingSizes = [
    'XXS', 'XS', 'S', 'M',
    'L', 'XL', 'XXL', 'XXXL',
  ]

  return [...(product.variants ?? [])].sort(
    (first, second) => {
      const firstIndex = clothingSizes.indexOf(first.size)
      const secondIndex = clothingSizes.indexOf(second.size)

      if (firstIndex !== -1 && secondIndex !== -1) {
        return firstIndex - secondIndex
      }

      if (firstIndex !== -1) return -1
      if (secondIndex !== -1) return 1

      return first.size.localeCompare(
        second.size,
        'en',
        { numeric: true },
      )
    },
  )
}

let previewRequest: Promise<Product[]> | null = null

export async function fetchPreviewProducts(): Promise<Product[]> {
  if (!previewRequest) {
    previewRequest = fetchProducts()
  }

  const request = previewRequest

  try {
    return await request
  } finally {
    if (previewRequest === request) {
      previewRequest = null
    }
  }
}
