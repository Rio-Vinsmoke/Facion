export const productCategories = [
  'Tops',
  'Bottoms',
  'Jeans',
  'Trousers',
  'Shorts',
  'Skirts',
  'Dresses',
  'Hoodies',
  'Sweatshirts',
  'Shirts',
  'T-shirts',
  'Jackets',
  'Shoes',
  'Accessories',
] as const

export type ProductCategory = (typeof productCategories)[number]
export type ProductGender = 'Men' | 'Women' | 'Unisex'

export type ProductVariant = {
  size: string
  stock: number
}

export type Product = {
  id: string
  name: string
  category: ProductCategory
  gender?: ProductGender
  price: number
  image: string
  cutout_image?: string | null
  color?: string | null
  description?: string | null
  variants?: ProductVariant[]
}