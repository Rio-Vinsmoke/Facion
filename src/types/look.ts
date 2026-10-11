export type LookItem = {
  id: string
  productId: string
  x: number
  y: number
  width: number
  rotation: number
}

export type Look = {
  id: string
  name: string
  items: LookItem[]
  updatedAt: string
}