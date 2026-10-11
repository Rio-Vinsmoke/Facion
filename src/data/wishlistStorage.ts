const PREFIX = 'facion:wishlist:v1:'

export function loadWishlist(ownerId: string | null): string[] {
  try {
    const raw = localStorage.getItem(PREFIX + (ownerId ?? 'guest'))
    if (!raw) return []
    const value: unknown = JSON.parse(raw)
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
      : []
  } catch {
    return []
  }
}

export function saveWishlist(ownerId: string | null, productIds: string[]): boolean {
  try {
    localStorage.setItem(PREFIX + (ownerId ?? 'guest'), JSON.stringify(productIds))
    return true
  } catch {
    return false
  }
}
