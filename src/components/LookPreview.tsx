
import { useEffect, useState } from 'react'
import { fetchPreviewProducts } from '../data/productStorage'
import type { Product } from '../types/product'
import type { Look } from '../types/look'

type Props = {
  look: Look
}

export default function LookPreview({ look }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setFailed(false)

    async function load() {
      try {
        const catalogue = await fetchPreviewProducts()

        if (!cancelled) {
          setProducts(catalogue)
        }
      } catch {
        if (!cancelled) {
          setFailed(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [reload])

  if (loading) {
    return (
      <div className="look-preview-empty" role="status">
        Loading preview...
      </div>
    )
  }

  if (failed) {
    return (
      <div className="look-preview-empty">
        <p role="alert">Could not load the preview.</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setReload(value => value + 1)}
        >
          Try again
        </button>
      </div>
    )
  }

  const productMap = new Map(
    products.map(product => [product.id, product]),
  )

  const pieces = look.items.flatMap(item => {
    const product = productMap.get(item.productId)

    if (!product) {
      return []
    }

    return [
      {
        ...item,
        image: product.cutout_image || product.image,
      },
    ]
  })

  if (pieces.length === 0) {
    return (
      <div className="look-preview-empty">
        {look.items.length > 0
          ? 'The products in this look are missing from the catalogue.'
          : 'No items to preview'}
      </div>
    )
  }

  const bounds = pieces.map(piece => {
    const angle = (piece.rotation * Math.PI) / 180

    const extent =
      (piece.width / 2) *
      (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle)))

    const centerX = piece.x + piece.width / 2
    const centerY = piece.y + piece.width / 2

    return {
      left: centerX - extent,
      right: centerX + extent,
      top: centerY - extent,
      bottom: centerY + extent,
    }
  })

  const padding = 30

  const left =
    Math.min(...bounds.map(bound => bound.left)) - padding

  const top =
    Math.min(...bounds.map(bound => bound.top)) - padding

  const right =
    Math.max(...bounds.map(bound => bound.right)) + padding

  const bottom =
    Math.max(...bounds.map(bound => bound.bottom)) + padding

  const missingCount = look.items.length - pieces.length

  return (
    <>
      <svg
        className="look-preview"
        viewBox={`${left} ${top} ${right - left} ${bottom - top}`}
        role="img"
        aria-label={`Outfit preview: ${look.name}`}
      >
        {pieces.map(piece => (
          <image
            key={piece.id}
            href={piece.image}
            x={piece.x}
            y={piece.y}
            width={piece.width}
            height={piece.width}
            preserveAspectRatio="xMidYMid meet"
            transform={`rotate(
              ${piece.rotation}
              ${piece.x + piece.width / 2}
              ${piece.y + piece.width / 2}
            )`}
          />
        ))}
      </svg>

      {missingCount > 0 && (
        <p role="status">
          Some pieces are missing from the catalogue.
        </p>
      )}
    </>
  )
}
