import { supabase } from '../lib/supabase'
import type {
  ProductCategory,
  ProductGender,
  ProductVariant,
} from '../types/product'

export type CatalogueUpload = {
  name: string
  category: ProductCategory
  gender: ProductGender
  price: number
  file: File
  variants: ProductVariant[]
}

export type UploadAttempt = {
  productId: string
  imageUrl: string | null
}

export async function hasCatalogueAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('catalogue_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error

  return data !== null
}

async function checkTransparentPng(file: File): Promise<void> {
  if (file.type !== 'image/png') {
    throw new Error('Choose a transparent PNG file.')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 10 MB.')
  }

  const bitmap = await createImageBitmap(file)

  try {
    if (bitmap.width * bitmap.height > 16000000) {
      throw new Error('Choose an image with no more than 16 million pixels.')
    }

    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Could not inspect this image.')

    context.drawImage(bitmap, 0, 0)

    const pixels = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    ).data

    let transparentPixels = 0
    let visiblePixels = 0

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) transparentPixels += 1
      if (pixels[index] > 0) visiblePixels += 1
    }

    if (transparentPixels === 0 || visiblePixels === 0) {
      throw new Error(
        'This image needs visible clothing and a transparent background.',
      )
    }
  } finally {
    bitmap.close()
  }
}

export async function uploadCatalogueProduct(
  userId: string,
  product: CatalogueUpload,
  attempt: UploadAttempt,
): Promise<string> {
  if (!attempt.imageUrl) {
    await checkTransparentPng(product.file)

    const path = `${userId}/${attempt.productId}.png`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, product.file, {
        contentType: 'image/png',
        upsert: false,
      })

    // A previous upload may have succeeded before the connection failed.
    if (error && String(error.statusCode) !== '409') throw error

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(path)

    attempt.imageUrl = data.publicUrl
  }

  const { data, error } = await supabase.rpc('create_catalogue_product', {
    p_product_id: attempt.productId,
    p_name: product.name,
    p_category: product.category,
    p_gender: product.gender,
    p_price: product.price,
    p_image: attempt.imageUrl,
    p_variants: product.variants,
  })

  if (error) throw error

  if (typeof data !== 'string') {
    throw new Error('Could not confirm the product. Retry the same upload.')
  }

  return data
}