import type { Look } from '../types/look'

const KEY = 'facion-looks-v1'

function isLook(value: unknown): value is Look {
  if (!value || typeof value !== 'object') return false

  const look = value as Record<string, unknown>

  return (
    typeof look.id === 'string' &&
    typeof look.name === 'string' &&
    typeof look.updatedAt === 'string' &&
    Array.isArray(look.items) &&
    look.items.every((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return false

      const item = entry as Record<string, unknown>

      return (
        typeof item.id === 'string' &&
        typeof item.productId === 'string' &&
        typeof item.x === 'number' &&
        Number.isFinite(item.x) &&
        typeof item.y === 'number' &&
        Number.isFinite(item.y) &&
        typeof item.width === 'number' &&
        Number.isFinite(item.width) &&
        item.width >= 40 &&
        item.width <= 700 &&
        typeof item.rotation === 'number' &&
        Number.isFinite(item.rotation)
      )
    })
  )
}

export function loadLooks(): Look[] {
  try {
    const data: unknown = JSON.parse(
      localStorage.getItem(KEY) ?? '[]',
    )

    return Array.isArray(data) ? data.filter(isLook) : []
  } catch {
    return []
  }
}

export function saveLooks(looks: Look[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(looks))
    return true
  } catch {
    return false
  }
}