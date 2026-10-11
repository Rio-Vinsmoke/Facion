
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  readCatalogueCsv,
  type BulkProductRow,
} from '../data/catalogueCsv'

type ImportProduct = {
  id: string
  sku: string
  name: string
  category: string
  gender: string
  price: number
  image: string
  variants: {
    size: string
    stock: number
  }[]
}

function prepareProducts(rows: BulkProductRow[]): ImportProduct[] {
  const products = new Map<string, ImportProduct>()

  for (const row of rows) {
    let product = products.get(row.sku)

    if (!product) {
      product = {
        id: row.sku,
        sku: row.sku,
        name: row.name,
        category: row.category,
        gender: row.gender,
        price: row.price,
        image: row.image,
        variants: [],
      }

      products.set(row.sku, product)
    }

    product.variants.push({
      size: row.size,
      stock: row.stock,
    })
  }

  return Array.from(products.values())
}

export default function CatalogueBulkUpload() {
  const [rows, setRows] = useState<BulkProductRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [success, setSuccess] = useState('')
  const working = useRef(false)

  async function handleFile(file: File | undefined) {
    if (working.current) return

    setRows([])
    setErrors([])
    setSuccess('')
    setFileName(file?.name ?? '')

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please choose a CSV file.'])
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors(['CSV must be smaller than 2 MB.'])
      return
    }

    try {
      const text = await file.text()
      const result = readCatalogueCsv(text)

      const products = prepareProducts(result.rows)
      const validationErrors = [...result.errors]

      if (products.length > 100) {
        validationErrors.push(
          'Import a maximum of 100 products per batch.',
        )
      }

      for (const product of products) {
        if (product.variants.length > 30) {
          validationErrors.push(
            `${product.sku}: maximum 30 sizes allowed.`,
          )
        }
      }

      setRows(result.rows)
      setErrors(validationErrors)
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : 'Could not read the CSV.',
      ])
    }
  }

  const products = prepareProducts(rows)
  const canImport =
    rows.length > 0 &&
    errors.length === 0 &&
    products.length <= 100 &&
    !importing &&
    !success

  async function importProducts() {
    if (!canImport || working.current) return

    const confirmed = window.confirm(
      `Import ${products.length} products into FACION? ` +
      'Existing products will not be overwritten.',
    )

    if (!confirmed) return

    working.current = true
    setImporting(true)
    setErrors([])

    try {
      const { data, error } = await supabase.rpc(
        'bulk_create_catalogue_products',
        {
          p_products: products,
        },
      )

      if (error) throw error

      if (
        typeof data !== 'number' ||
        data !== products.length
      ) {
        throw new Error(
          'Import result could not be confirmed. ' +
          'Check Supabase before trying again.',
        )
      }

      setSuccess(
        `${data} products imported successfully!`,
      )
      setRows([])
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : 'Import failed.',
        'Check your Supabase products table before retrying. ' +
          'The previous request may already have succeeded.',
      ])
    } finally {
      working.current = false
      setImporting(false)
    }
  }

  return (
    <section className="studio-panel">
      <h3>Bulk Product Upload</h3>

      <p>
        Import FACION clothing products from a CSV file.
        Review the products before saving them.
      </p>

      <label className="studio-control">
        Select product CSV

        <input
          type="file"
          accept=".csv,text/csv"
          disabled={importing}
          onChange={event => {
            void handleFile(
              event.target.files?.[0],
            )
          }}
        />
      </label>

      {fileName && <p>Selected: {fileName}</p>}

      {errors.length > 0 && (
        <div role="alert">
          <h4>Errors</h4>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <p role="status" style={{ color: 'green' }}>
          {success}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <h4>Product Preview</h4>

          <p>
            {products.length} products ·{' '}
            {rows.length} size variants
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Collection</th>
                  <th>Size</th>
                  <th>Stock</th>
                  <th>Price</th>
                </tr>
              </thead>

              <tbody>
                {rows.slice(0, 50).map(row => (
                  <tr
                    key={`${row.sku}-${row.size}`}
                  >
                    <td>{row.sku}</td>
                    <td>{row.name}</td>
                    <td>{row.category}</td>
                    <td>{row.gender}</td>
                    <td>{row.size}</td>
                    <td>{row.stock}</td>
                    <td>₹{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 50 && (
            <p>Showing the first 50 variants.</p>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={!canImport}
            onClick={() => void importProducts()}
          >
            {importing
              ? 'Importing products...'
              : 'Import Products'}
          </button>
        </>
      )}
    </section>
  )
}
