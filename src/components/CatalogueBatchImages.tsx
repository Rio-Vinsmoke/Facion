
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type ImageKind = 'storefront' | 'cutout'

type ImageRow = {
  id: string
  file: File
  sku: string
  kind: ImageKind
  preview: string
  error: string
  status: 'pending' | 'uploaded' | 'failed'
  url: string
}

const allowedTypes = [
  'image/png',
  'image/jpeg',
  'image/webp',
]

function getError(file: File): string {
  if (!allowedTypes.includes(file.type)) {
    return 'Only PNG, JPG and WebP images are allowed.'
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'File must be smaller than 10 MB.'
  }

  return ''
}

export default function CatalogueBatchImages() {
  const [images, setImages] = useState<ImageRow[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const imagesRef = useRef<ImageRow[]>([])
  const busyRef = useRef(false)

  useEffect(() => {
    return () => {
      imagesRef.current.forEach(image =>
        URL.revokeObjectURL(image.preview),
      )
    }
  }, [])

  function updateImages(
    updater: (current: ImageRow[]) => ImageRow[],
  ) {
    setImages(current => {
      const next = updater(current)
      imagesRef.current = next
      return next
    })
  }

  function selectImages(files: FileList | null) {
    if (!files || busyRef.current) return

    const selected = Array.from(files)

    if (selected.length > 100) {
      setMessage('Select a maximum of 100 images.')
      return
    }

    imagesRef.current.forEach(image =>
      URL.revokeObjectURL(image.preview),
    )

    const next: ImageRow[] = selected.map(file => ({
      id: crypto.randomUUID(),
      file,
      sku: file.name.replace(/\.[^.]+$/, ''),
      kind: 'storefront',
      preview: URL.createObjectURL(file),
      error: getError(file),
      status: 'pending',
      url: '',
    }))

    imagesRef.current = next
    setImages(next)
    setMessage('')
  }

  function updateRow(
    id: string,
    changes: Partial<ImageRow>,
  ) {
    if (busyRef.current) return

    updateImages(current =>
      current.map(image =>
        image.id === id
          ? { ...image, ...changes }
          : image,
      ),
    )
  }

  async function uploadImages() {
    if (busyRef.current || images.length === 0) return

    const invalid = images.some(image =>
      image.error ||
      !/^[A-Za-z0-9_-]{1,100}$/.test(image.sku) ||
      (image.kind === 'cutout' &&
        image.file.type !== 'image/png'),
    )

    if (invalid) {
      setMessage(
        'Fix invalid SKUs or files before uploading. ' +
        'Cutouts must be PNG files.',
      )
      return
    }

    busyRef.current = true
    setUploading(true)
    setMessage('Uploading images...')

    try {
      const { data: sessionData, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError

      const user = sessionData.user

      if (!user) {
        throw new Error('Please sign in as an admin.')
      }

      let successCount = 0
      let failureCount = 0

      for (const image of images) {
        if (image.status === 'uploaded') continue

        const extension =
          image.file.type === 'image/png'
            ? 'png'
            : image.file.type === 'image/webp'
              ? 'webp'
              : 'jpg'

        const path =
          `${user.id}/batch/${image.sku}/` +
          `${image.kind}-${crypto.randomUUID()}.${extension}`

        try {
          const { error } = await supabase.storage
            .from('product-images')
            .upload(path, image.file, {
              contentType: image.file.type,
              upsert: false,
            })

          if (error) throw error

          const { data } = supabase.storage
            .from('product-images')
            .getPublicUrl(path)
            
const { error: linkError } = await supabase.rpc(
  'set_catalogue_product_image',
  {
    p_sku: image.sku,
    p_path: path,
    p_kind: image.kind,
  },
)

if (linkError) throw linkError


          updateImages(current =>
            current.map(row =>
              row.id === image.id
                ? {
                    ...row,
                    status: 'uploaded',
                    error: '',
                    url: data.publicUrl,
                  }
                : row,
            ),
          )

          successCount++
        } catch (error) {
          failureCount++

          updateImages(current =>
            current.map(row =>
              row.id === image.id
                ? {
                    ...row,
                    status: 'failed',
                    error:
                      error instanceof Error
                        ? error.message
                        : 'Upload failed.',
                  }
                : row,
            ),
          )
        }
      }

      setMessage(
        `${successCount} images uploaded. ` +
        `${failureCount} failed. ` +
        'Successfully uploaded images are now linked to their products.',
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not start upload.',
      )
    } finally {
      busyRef.current = false
      setUploading(false)
    }
  }

  return (
    <section className="studio-panel">
      <h3>Batch Clothing Image Upload</h3>

      <p>
        Upload multiple FACION product images
        to Supabase Storage.
      </p>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={uploading}
        onChange={event =>
          selectImages(event.target.files)
        }
      />

      <p>{images.length} images selected</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 20,
        }}
      >
        {images.map(image => (
          <div
            key={image.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <img
              src={image.preview}
              alt={image.file.name}
              style={{
                width: '100%',
                height: 160,
                objectFit: 'contain',
              }}
            />

            <label>
              Product SKU
              <input
                value={image.sku}
                disabled={
                  uploading ||
                  image.status === 'uploaded'
                }
                onChange={event =>
                  updateRow(image.id, {
                    sku: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Image type
              <select
                value={image.kind}
                disabled={
                  uploading ||
                  image.status === 'uploaded'
                }
                onChange={event =>
                  updateRow(image.id, {
                    kind: event.target.value as ImageKind,
                  })
                }
              >
                <option value="storefront">
                  Storefront image
                </option>
                <option value="cutout">
                  Outfit cutout
                </option>
              </select>
            </label>

            <p>Status: {image.status}</p>

            {image.error && (
              <p role="alert">{image.error}</p>
            )}

            {image.url && (
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View uploaded image
              </a>
            )}
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <button
          type="button"
          className="primary-button"
          disabled={uploading}
          onClick={() => void uploadImages()}
        >
          {uploading
            ? 'Uploading...'
            : 'Upload Images to Supabase'}
        </button>
      )}

      {message && <p role="status">{message}</p>}
    </section>
  )
}
