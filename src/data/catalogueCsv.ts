
import {
  productCategories,
  type ProductCategory,
  type ProductGender,
} from '../types/product'

export type BulkProductRow = {
  rowNumber: number
  sku: string
  name: string
  category: ProductCategory
  gender: ProductGender
  price: number
  image: string
  size: string
  stock: number
}

export type CsvImportResult = {
  rows: BulkProductRow[]
  errors: string[]
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if (
      (char === '\n' || char === '\r') &&
      !quoted
    ) {
      if (char === '\r' && text[i + 1] === '\n') i++

      row.push(value)
      if (row.some(cell => cell.trim())) rows.push(row)

      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (quoted) {
    throw new Error('CSV contains an unclosed quote.')
  }

  row.push(value)
  if (row.some(cell => cell.trim())) rows.push(row)

  return rows
}

export function readCatalogueCsv(text: string): CsvImportResult {
  const errors: string[] = []
  const products: BulkProductRow[] = []

  const records = parseCsv(text.replace(/^\uFEFF/, ''))

  if (!records.length) {
    return { rows: [], errors: ['CSV file is empty.'] }
  }

  const headers = records[0].map(value =>
    value.trim().toLowerCase(),
  )

  const required = [
    'sku', 'name', 'category', 'gender',
    'price', 'image', 'size', 'stock',
  ]

  for (const field of required) {
    if (!headers.includes(field)) {
      errors.push(`Missing column: ${field}`)
    }
  }

  if (new Set(headers).size !== headers.length) {
    errors.push('CSV contains duplicate column headers.')
  }

  if (errors.length) return { rows: [], errors }

  const seenVariants = new Set<string>()
  const productDetails = new Map<string, string>()

  for (let i = 1; i < records.length; i++) {
    const record = records[i]
    const rowNumber = i + 1

    if (record.length !== headers.length) {
      errors.push(`Row ${rowNumber}: incorrect column count.`)
      continue
    }

    const get = (field: string) =>
      record[headers.indexOf(field)].trim()

    const sku = get('sku')
    const name = get('name')
    const category = get('category')
    const gender = get('gender')
    const priceText = get('price')
    const image = get('image')
    const size = get('size')
    const stockText = get('stock')

    if (!/^[A-Za-z0-9_-]{1,100}$/.test(sku)) {
      errors.push(`Row ${rowNumber}: invalid SKU.`)
      continue
    }

    if (!name || name.length > 120) {
      errors.push(`Row ${rowNumber}: invalid product name.`)
      continue
    }

    if (!productCategories.includes(
      category as ProductCategory,
    )) {
      errors.push(`Row ${rowNumber}: invalid category.`)
      continue
    }

    if (!['Men', 'Women', 'Unisex'].includes(gender)) {
      errors.push(`Row ${rowNumber}: invalid collection.`)
      continue
    }

    if (!/^\d+(\.\d{1,2})?$/.test(priceText) ||
        Number(priceText) > 99999999.99) {
      errors.push(`Row ${rowNumber}: invalid price.`)
      continue
    }

    if (!/^https:\/\/\S+$/i.test(image)) {
      errors.push(`Row ${rowNumber}: invalid HTTPS image URL.`)
      continue
    }

    if (!size || size.length > 20 ||
        !/^\d+$/.test(stockText) ||
        Number(stockText) > 1000000) {
      errors.push(`Row ${rowNumber}: invalid size or stock.`)
      continue
    }

    const variantKey = `${sku}:${size}`

    if (seenVariants.has(variantKey)) {
      errors.push(`Row ${rowNumber}: duplicate SKU and size.`)
      continue
    }

    seenVariants.add(variantKey)

    const details = JSON.stringify({
      name, category, gender, priceText: Number(priceText),
      image,
    })

    const previous = productDetails.get(sku)

    if (previous && previous !== details) {
      errors.push(`Row ${rowNumber}: inconsistent details for SKU ${sku}.`)
      continue
    }

    productDetails.set(sku, details)

    products.push({
      rowNumber,
      sku,
      name,
      category: category as ProductCategory,
      gender: gender as ProductGender,
      price: Number(priceText),
      image,
      size,
      stock: Number(stockText),
    })
  }

  return { rows: products, errors }
}
