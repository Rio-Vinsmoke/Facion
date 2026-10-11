
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  productCategories,
  type ProductCategory,
  type ProductGender,
} from '../types/product'

type Draft = {
  id: string
  file: File
  preview: string
  sku: string
  name: string
  category: ProductCategory
  gender: ProductGender
  price: string
  selected: boolean
  status: 'ready' | 'imported' | 'skipped' | 'failed'
  error: string
}

const types = ['image/jpeg', 'image/png', 'image/webp']

const mappings = [
  { words: ['dresses', 'dress'], category: 'Dresses' },
  { words: ['jeans', 'denim'], category: 'Jeans' },
  { words: ['shirts'], category: 'Shirts' },
  { words: ['tees', 'tshirts', 't-shirts'], category: 'T-Shirts' },
  { words: ['tops'], category: 'Tops' },
  { words: ['hoodies', 'hoodie'], category: 'Hoodies' },
  { words: ['shoes', 'sneakers'], category: 'Shoes' },
  { words: ['bags', 'handbags'], category: 'Bags' },
  { words: ['accessories', 'jewellery'], category: 'Accessories' },
]

const prices: Record<string, number> = {
  Tops: 799,
  'T-Shirts': 699,
  Shirts: 999,
  Jeans: 1499,
  Dresses: 1699,
  Hoodies: 1299,
  Shoes: 1999,
  Bags: 1499,
  Accessories: 499,
}

function detect(path: string) {
  const folder = path.split('/').slice(0, -1).join('/').toLowerCase()

  const gender: ProductGender =
    /\bwomen\b/.test(folder) ? 'Women'
    : /\bmen\b/.test(folder) ? 'Men'
    : 'Unisex'

  const match = mappings.find(item =>
    item.words.some(word => folder.includes(word)),
  )

  const category = productCategories.find(
    value => value === match?.category,
  ) ?? productCategories[0]

  return {
    gender,
    category,
    price: String(prices[category] ?? 999),
    recognized: !!match && category === match.category,
  }
}

async function makeSku(file: File) {
  const buffer = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buffer)

  const hex = Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  return `FAC-IMG-${hex.slice(0, 24).toUpperCase()}`
}

function variants(category: ProductCategory) {
  const sizes =
    ['Shoes'].includes(category) ? ['UK 6', 'UK 7', 'UK 8']
    : ['Bags', 'Accessories'].includes(category) ? ['One size']
    : ['S', 'M', 'L']

  return sizes.map(size => ({ size, stock: 20 }))
}

function getExtension(file: File) {
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'jpg'
}

export default function CatalogueFolderImport() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [preparing, setPreparing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [testMode, setTestMode] = useState(true)

  const busyRef = useRef(false)
  const requestRef = useRef(0)
  const previewsRef = useRef<string[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      requestRef.current++
      previewsRef.current.forEach(URL.revokeObjectURL)
    }
  }, [])

  async function selectFolder(files: FileList | null) {
    if (!files || busyRef.current) return

    const request = ++requestRef.current
    setPreparing(true)
    setMessage('Reading clothing images...')

    const filesArray = Array.from(files)
      .filter(file => types.includes(file.type))
      .sort((a, b) =>
        (a.webkitRelativePath || a.name).localeCompare(
          b.webkitRelativePath || b.name,
        ),
      )

    const next: Draft[] = []
    const seen = new Set<string>()
    let duplicates = 0

    try {
      for (const file of filesArray) {
        if (request !== requestRef.current || !mountedRef.current) {
          return
        }

        if (file.size > 10 * 1024 * 1024) {
          continue
        }

        const sku = await makeSku(file)

        if (seen.has(sku)) {
          duplicates++
          continue
        }

        seen.add(sku)

        const path = file.webkitRelativePath || file.name
        const details = detect(path)

        next.push({
          id: crypto.randomUUID(),
          file,
          preview: '',
          sku,
          name: `${details.gender} ${details.category} ${next.length + 1}`,
          category: details.category,
          gender: details.gender,
          price: details.price,
          selected: details.recognized,
          status: 'ready',
          error: details.recognized ? '' : 'Review category',
        })
      }

      if (request !== requestRef.current || !mountedRef.current) {
        return
      }

      const urls = next.map(draft => {
        const url = URL.createObjectURL(draft.file)
        draft.preview = url
        return url
      })

      const old = previewsRef.current
      previewsRef.current = urls
      setDrafts(next)
      old.forEach(URL.revokeObjectURL)

      setProgress(0)
      setMessage(
        `${next.length} unique images ready. ` +
        `${duplicates} identical duplicates skipped.`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Folder scan failed.',
      )
    } finally {
      if (request === requestRef.current && mountedRef.current) {
        setPreparing(false)
      }
    }
  }

  function update(id: string, changes: Partial<Draft>) {
    setDrafts(current =>
      current.map(draft =>
        draft.id === id ? { ...draft, ...changes } : draft,
      ),
    )
  }

  async function importCollection() {
    if (busyRef.current || preparing) return

    const ready = drafts.filter(
      draft => draft.selected && draft.status !== 'imported' &&
        draft.status !== 'skipped',
    )

    const batch = testMode ? ready.slice(0, 5) : ready

    if (!batch.length) {
      setMessage('No new selected products to import.')
      return
    }

    if (batch.some(d =>
      !d.name.trim() || d.name.length > 120 ||
      !/^\d+(\.\d{1,2})?$/.test(d.price) ||
      Number(d.price) > 99999999.99,
    )) {
      setMessage('Fix invalid product names or prices first.')
      return
    }

    const confirmed = window.confirm(
      `Import ${batch.length} demo products into FACION?`,
    )

    if (!confirmed) return

    busyRef.current = true
    setImporting(true)
    setProgress(0)

    let imported = 0
    let skipped = 0
    let failed = 0

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError
      if (!auth.user) throw new Error('Sign in as a catalogue admin.')

      const userId = auth.user.id

      const { data: admin, error: adminError } = await supabase
        .from('catalogue_admins')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (adminError) throw adminError
      if (!admin) throw new Error('Catalogue admin access required.')

      // Check existing SKUs before uploading.
      const existing = new Set<string>()

      for (let i = 0; i < batch.length; i += 50) {
        const slice = batch.slice(i, i + 50)

        const { data, error } = await supabase
          .from('products')
          .select('id,sku')
          .in('id', slice.map(item => item.sku))

        if (error) throw error

        data?.forEach(product => existing.add(product.id))
      }

      // Import conservatively, one product at a time.
      // This makes it easier to identify failures and retry.
      for (const draft of batch) {
        if (existing.has(draft.sku)) {
          skipped++
          update(draft.id, {
            status: 'skipped',
            error: 'Already in catalogue',
          })
          setProgress(imported + skipped + failed)
          continue
        }

        try {
          const extension = getExtension(draft.file)
          const path = `${userId}/collections/${draft.sku}.${extension}`

          const { error: storageError } = await supabase.storage
            .from('product-images')
            .upload(path, draft.file, {
              contentType: draft.file.type,
              upsert: false,
            })

          // Existing file can be reused after an interrupted import.
          if (
            storageError &&
            String(storageError.statusCode) !== '409'
          ) {
            throw storageError
          }

          const { data: imageData } = supabase.storage
            .from('product-images')
            .getPublicUrl(path)

          const { data: count, error: rpcError } = await supabase.rpc(
            'bulk_create_catalogue_products',
            {
              p_products: [{
                id: draft.sku,
                sku: draft.sku,
                name: draft.name.trim(),
                category: draft.category,
                gender: draft.gender,
                price: Number(draft.price),
                image: imageData.publicUrl,
                variants: variants(draft.category),
              }],
            },
          )

          if (rpcError) throw rpcError

          if (count !== 1) {
            throw new Error('Import result could not be confirmed.')
          }

          imported++
          update(draft.id, {
            status: 'imported',
            error: '',
          })
        } catch (error) {
          // Check whether an interrupted request saved the product.
          const { data: saved } = await supabase
            .from('products')
            .select('id')
            .eq('id', draft.sku)
            .maybeSingle()

          if (saved) {
            skipped++
            update(draft.id, {
              status: 'skipped',
              error: 'Product exists in catalogue',
            })
          } else {
            failed++
            update(draft.id, {
              status: 'failed',
              error:
                error instanceof Error
                  ? error.message
                  : 'Import failed',
            })
          }
        }

        setProgress(imported + skipped + failed)
      }

      setMessage(
        `Finished: ${imported} imported, ` +
        `${skipped} already existing, ${failed} failed.`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not start import.',
      )
    } finally {
      busyRef.current = false
      setImporting(false)
    }
  }

  const selectedCount = drafts.filter(d => d.selected).length
  const remaining = drafts.filter(
    d => d.selected && d.status !== 'imported' &&
      d.status !== 'skipped',
  ).length

  return (
    <section className="studio-panel">
      <h3>FACION Collection Importer</h3>

      <p>
        Select your clothing folder, review demo details,
        and import products into Supabase.
      </p>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={preparing || importing}
        {...{ webkitdirectory: '' }}
        onChange={event =>
          void selectFolder(event.target.files)
        }
      />

      {preparing && <p role="status">Preparing images...</p>}
      {message && <p role="status">{message}</p>}

      {drafts.length > 0 && (
        <>
          <h4>Collection Preview</h4>

          <p>
            {drafts.length} products · {selectedCount} selected ·{' '}
            {remaining} remaining
          </p>

          <div style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}>
            <button
              type="button"
              className="secondary-button"
              disabled={importing}
              onClick={() =>
                setDrafts(current =>
                  current.map(d => ({ ...d, selected: true })),
                )
              }
            >
              Select All
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={importing}
              onClick={() =>
                setDrafts(current =>
                  current.map(d => ({ ...d, selected: false })),
                )
              }
            >
              Deselect All
            </button>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <input
              type="checkbox"
              checked={testMode}
              disabled={importing}
              onChange={event => setTestMode(event.target.checked)}
            />
            Test mode — import only 5 products
          </label>

          <button
            type="button"
            className="primary-button"
            disabled={importing || preparing || remaining === 0}
            onClick={() => void importCollection()}
          >
            {importing
              ? `Importing ${progress} processed...`
              : testMode
                ? 'Import 5 Test Products'
                : `Import ${remaining} Products`}
          </button>

          <p>
            Imported products will appear in Shop.
            Generated cutouts will be added later.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            marginTop: 20,
          }}>
            {drafts.map(draft => (
              <div key={draft.id} style={{
                border: '1px solid #ddd',
                borderRadius: 12,
                padding: 12,
              }}>
                <img
                  src={draft.preview}
                  alt={draft.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'contain',
                  }}
                />

                <label>
                  <input
                    type="checkbox"
                    checked={draft.selected}
                    disabled={importing}
                    onChange={event =>
                      update(draft.id, {
                        selected: event.target.checked,
                      })
                    }
                  />
                  Include
                </label>

                <p>Status: {draft.status}</p>
                {draft.error && <p role="alert">{draft.error}</p>}

                <label className="studio-control">
                  SKU
                  <input value={draft.sku} readOnly />
                </label>

                <label className="studio-control">
                  Name
                  <input
                    value={draft.name}
                    disabled={importing}
                    onChange={event =>
                      update(draft.id, { name: event.target.value })
                    }
                  />
                </label>

                <label className="studio-control">
                  Category
                  <select
                    value={draft.category}
                    disabled={importing}
                    onChange={event =>
                      update(draft.id, {
                        category: event.target.value as ProductCategory,
                      })
                    }
                  >
                    {productCategories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="studio-control">
                  Collection
                  <select
                    value={draft.gender}
                    disabled={importing}
                    onChange={event =>
                      update(draft.id, {
                        gender: event.target.value as ProductGender,
                      })
                    }
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </label>

                <label className="studio-control">
                  Demo Price (₹)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.price}
                    disabled={importing}
                    onChange={event =>
                      update(draft.id, {
                        price: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
