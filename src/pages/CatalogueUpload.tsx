import { useEffect, useRef, useState } from 'react'

import CatalogueBulkUpload from './CatalogueBulkUpload'


import CatalogueBatchImages from '../components/CatalogueBatchImages'


import CatalogueFolderImport from '../components/CatalogueFolderImport'

import CatalogueCutoutImport from '../components/CatalogueCutoutImport'




import {
  hasCatalogueAccess,
  uploadCatalogueProduct,
  type CatalogueUpload as UploadData,
  type UploadAttempt,
} from '../data/catalogueUploadStorage'
import {
  productCategories,
  type ProductCategory,
  type ProductGender,
} from '../types/product'

type Props = {
  userId: string
}

type SizeRow = {
  id: string
  size: string
  stock: string
}

function newSize(): SizeRow {
  return {
    id: crypto.randomUUID(),
    size: '',
    stock: '0',
  }
}

function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Please try again.'
}

export default function CatalogueUpload({ userId }: Props) {
  const [allowed, setAllowed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState('')
  const [reload, setReload] = useState(0)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('Tops')
  const [gender, setGender] = useState<ProductGender>('Unisex')
  const [price, setPrice] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [sizes, setSizes] = useState<SizeRow[]>(() => [newSize()])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [productId, setProductId] = useState('')
  const [pending, setPending] = useState(false)
  const [formSession, setFormSession] = useState(0)

  const working = useRef(false)
  const submission = useRef<UploadData | null>(null)
  const attempt = useRef<UploadAttempt | null>(null)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setAccessError('')
    setAllowed(false)

    async function checkAccess() {
      try {
        const access = await hasCatalogueAccess(userId)
        if (!cancelled) setAllowed(access)
      } catch (cause) {
        if (!cancelled) setAccessError(errorMessage(cause))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void checkAccess()

    return () => {
      cancelled = true
    }
  }, [userId, reload])

  useEffect(() => {
    if (!file) {
      setPreview('')
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [file])

  function updateSize(id: string, field: 'size' | 'stock', value: string) {
    setSizes(current =>
      current.map(row =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    )
  }

  async function submit() {
    if (!allowed || working.current || productId) return

    setError('')

    if (!submission.current) {
      const trimmedName = name.trim()
      const trimmedPrice = price.trim()

      if (!trimmedName || !file) {
        setError('Enter a product name and choose a transparent PNG.')
        return
      }

      if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
        setError('Enter a valid price, such as 999 or 999.50.')
        return
      }

      const numericPrice = Number(trimmedPrice)

      if (!Number.isFinite(numericPrice) || numericPrice > 99999999.99) {
        setError('Enter a price no greater than 99,999,999.99.')
        return
      }

      const variants = sizes.map(row => ({
        size: row.size.trim(),
        stock: Number(row.stock),
      }))

      if (
        sizes.some(row => !/^\d+$/.test(row.stock.trim())) ||
        variants.some(variant =>
          !variant.size ||
          variant.size.length > 20 ||
          !Number.isInteger(variant.stock) ||
          variant.stock < 0 ||
          variant.stock > 1000000,
        )
      ) {
        setError('Fill every size and enter whole-number stock from 0 to 1,000,000.')
        return
      }

      if (new Set(variants.map(variant => variant.size)).size !== variants.length) {
        setError('Enter each size only once.')
        return
      }

      if (file.type !== 'image/png' || file.size > 10 * 1024 * 1024) {
        setError('Choose a transparent PNG smaller than 10 MB.')
        return
      }

      submission.current = {
        name: trimmedName,
        category,
        gender,
        price: numericPrice,
        file,
        variants,
      }

      attempt.current = {
        productId: crypto.randomUUID(),
        imageUrl: null,
      }
    }

    const upload = submission.current
    const currentAttempt = attempt.current
    if (!upload || !currentAttempt) return

    working.current = true
    setBusy(true)
    setPending(true)

    try {
      const savedId = await uploadCatalogueProduct(
        userId,
        upload,
        currentAttempt,
      )

      setProductId(savedId)
      setPending(false)
    } catch (cause) {
      setError(errorMessage(cause))

      // Before an upload is confirmed, allow image/form corrections.
      if (!currentAttempt.imageUrl) {
        submission.current = null
        setPending(false)
      }
    } finally {
      working.current = false
      setBusy(false)
    }
  }

  function startAnother() {
    setName('')
    setCategory('Tops')
    setGender('Unisex')
    setPrice('')
    setFile(null)
    setSizes([newSize()])
    setError('')
    setProductId('')
    setPending(false)
    submission.current = null
    attempt.current = null
    setFormSession(value => value + 1)
  }

  if (loading) {
    return <p role="status">Checking catalogue access...</p>
  }

  if (accessError) {
    return (
      <section>
        <p role="alert">Could not check upload access. {accessError}</p>
        <button
          className="secondary-button"
          onClick={() => setReload(value => value + 1)}
        >
          Try again
        </button>
      </section>
    )
  }

  if (!allowed) return null

  

return (
  <>
    <CatalogueFolderImport />

    <CatalogueBulkUpload />

    <CatalogueBatchImages />

    <CatalogueCutoutImport />

    <section className="studio-panel">

      <h3>Add clothes to the catalogue</h3>


      {productId ? (
        <>
          <p role="status">Product added successfully.</p>
          <p>Product ID: {productId}</p>
          <p>
            Open Shop to see it. Refresh the app to update the
            Outfit Studio library too.
          </p>
          <button className="primary-button" onClick={startAnother}>
            Add another product
          </button>
        </>
      ) : (
        <>
          <p>
            Upload a prepared transparent PNG cutout.
            Background removal is not connected to this form yet.
          </p>

          <form
            key={formSession}
            onSubmit={event => {
              event.preventDefault()
              void submit()
            }}
          >
            <fieldset
              disabled={busy || pending}
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              <label className="studio-control">
                Product name
                <input
                  required
                  maxLength={120}
                  value={name}
                  onChange={event => setName(event.target.value)}
                />
              </label>

              <label className="studio-control">
                Collection
                <select
                  value={gender}
                  onChange={event =>
                    setGender(event.target.value as ProductGender)
                  }
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </label>

              <label className="studio-control">
                Category
                <select
                  value={category}
                  onChange={event =>
                    setCategory(event.target.value as ProductCategory)
                  }
                >
                  {productCategories.map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className="studio-control">
                Price in rupees
                <input
                  required
                  type="number"
                  min="0"
                  max="99999999.99"
                  step="0.01"
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                />
              </label>

              <label className="studio-control">
                Transparent clothing image
                <input
                  required
                  type="file"
                  accept="image/png"
                  onChange={event =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>

              {preview && (
                <img
                  src={preview}
                  alt="Selected clothing preview"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: 240,
                    height: 240,
                    objectFit: 'contain',
                    background: '#fff',
                    marginBottom: 16,
                  }}
                />
              )}

              <h4>Sizes and stock</h4>
              <p>Examples: S, M, L, UK 7, or One size.</p>

              {sizes.map(row => (
                <div key={row.id} className="shop-filters">
                  <label className="studio-control">
                    Size
                    <input
                      required
                      maxLength={20}
                      value={row.size}
                      onChange={event =>
                        updateSize(row.id, 'size', event.target.value)
                      }
                    />
                  </label>

                  <label className="studio-control">
                    Stock
                    <input
                      required
                      type="number"
                      min="0"
                      max="1000000"
                      step="1"
                      value={row.stock}
                      onChange={event =>
                        updateSize(row.id, 'stock', event.target.value)
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="secondary-button"
                    disabled={sizes.length === 1}
                    onClick={() =>
                      setSizes(current =>
                        current.filter(entry => entry.id !== row.id),
                      )
                    }
                  >
                    Remove size
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="secondary-button"
                disabled={sizes.length >= 30}
                onClick={() =>
                  setSizes(current => [...current, newSize()])
                }
              >
                + Add size
              </button>
            </fieldset>

            <p>
              {pending && !busy
                ? 'Retry the same submission to confirm whether it saved.'
                : ''}
            </p>

            <button
              type="submit"
              className="primary-button"
              disabled={busy}
            >
              {busy
                ? 'Uploading and saving...'
                : pending
                  ? 'Retry product save'
                  : 'Add product'}
            </button>
          </form>

          {error && <p role="alert">{error}</p>}
        </>
      )}
    
    </section>
  </>
  )
}
