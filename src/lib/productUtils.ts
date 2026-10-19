import type { Product } from '../types/product'

/**
 * Clean SVG placeholder data URI for products when no image can be loaded.
 */
export const SAFE_PRODUCT_IMAGE_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="#f5f4f1">' +
      '<rect width="300" height="400" fill="#f5f4f1"/>' +
      '<path d="M110 130 C120 110, 180 110, 190 130 L230 150 L210 190 L190 180 L190 280 L110 280 L110 180 L90 190 L70 150 Z" ' +
      'fill="none" stroke="#c4beba" stroke-width="6" stroke-linejoin="round"/>' +
      '<text x="150" y="320" font-family="sans-serif" font-size="14" fill="#8c8289" text-anchor="middle">Garment preview</text>' +
      '</svg>',
  )

/**
 * Returns the preferred image URL for a product, prioritizing transparent cutouts
 * with automatic fallback to primary product image.
 */
export function getProductDisplayImage(
  product: { image: string; cutout_image?: string | null },
): string {
  if (product.cutout_image && product.cutout_image.trim()) {
    return product.cutout_image.trim()
  }
  return product.image || SAFE_PRODUCT_IMAGE_FALLBACK
}

/**
 * Normalizes category name into a CSS class name for category-aware scaling.
 */
export function getProductCategoryClass(category?: string): string {
  if (!category) return 'cat-other'
  return `cat-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

/**
 * Returns the natural height-to-width aspect ratio for a garment (height / width).
 * Uses real measured image dimensions if available, or category-specific proportions.
 */
export function getGarmentAspectRatio(
  product: { category?: string; name?: string },
  measuredRatio?: number,
): number {
  if (measuredRatio && measuredRatio > 0.3 && measuredRatio < 4.0) {
    return measuredRatio
  }

  const category = (product.category || '').toLowerCase()

  if (category.includes('dress')) {
    return 1.333 // 3:4 canvas standard
  }
  if (
    category.includes('jean') ||
    category.includes('trouser') ||
    category.includes('bottom')
  ) {
    return 1.5 // Long vertical leg drape
  }
  if (category.includes('skirt') || category.includes('short')) {
    return 1.15
  }
  if (
    category.includes('top') ||
    category.includes('shirt') ||
    category.includes('hoodie') ||
    category.includes('sweatshirt') ||
    category.includes('jacket')
  ) {
    return 1.25 // Standard torso
  }
  if (category.includes('shoe') || category.includes('accessories')) {
    return 1.0 // Square profile
  }

  // FACION standard 1200x1600 canvas aspect ratio (1600/1200 = 4/3 = 1.333)
  return 1.333
}

/**
 * Matches a product against a search query across name, category, colour, description, and gender.
 * Supports case-insensitive partial matching and useful multi-keyword queries (AND across keywords).
 * Protects against false substring matches (e.g., searching "men" won't match "Women").
 */
export function matchesProductSearch(
  product: Product,
  query: string,
): boolean {
  const trimmed = query.trim()
  if (!trimmed) return true

  // Split query into individual search tokens
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const nameLower = (product.name || '').toLowerCase()
  const categoryLower = (product.category || '').toLowerCase()
  const colorLower = (product.color || '').toLowerCase()
  const genderLower = (product.gender || '').toLowerCase()
  const descLower = (product.description || '').toLowerCase()

  return tokens.every(token => {
    const isMenToken = /^(men|mens|man)$/i.test(token)
    const isWomenToken = /^(women|womens|woman)$/i.test(token)

    // 1. Gender matching
    if (isMenToken) {
      if (genderLower === 'men') return true
    } else if (isWomenToken) {
      if (genderLower === 'women') return true
    } else if (genderLower && genderLower.includes(token)) {
      return true
    }

    // 2. Name matching with exact-word boundary guard for "men"
    if (isMenToken) {
      if (/\b(men|mens|man)\b/i.test(nameLower)) return true
    } else if (nameLower.includes(token)) {
      return true
    }

    // 3. Category matching with exact-word boundary guard for "men"
    if (isMenToken) {
      if (/\b(men|mens|man)\b/i.test(categoryLower)) return true
    } else if (
      categoryLower.includes(token) ||
      token.includes(categoryLower)
    ) {
      return true
    }

    // 4. Colour / Color matching
    if (colorLower && colorLower.includes(token)) {
      return true
    }

    // 5. Description matching with exact-word boundary guard for "men"
    if (descLower) {
      if (isMenToken) {
        if (/\b(men|mens|man)\b/i.test(descLower)) return true
      } else if (descLower.includes(token)) {
        return true
      }
    }

    return false
  })
}
