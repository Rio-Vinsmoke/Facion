
import { useEffect, useState } from 'react'
import { fetchPreviewProducts } from '../data/productStorage'
import type { Product } from '../types/product'
import type { Look } from '../types/look'
import {
  getProductDisplayImage,
  getGarmentAspectRatio,
} from '../lib/productUtils'

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
          onClick={() => {
            setLoading(true)
            setFailed(false)
            setReload(value => value + 1)
          }}
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

    const ratio = getGarmentAspectRatio(product)
    const height = item.width * ratio

    return [
      {
        ...item,
        product,
        height,
        image: getProductDisplayImage(product),
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
    const cos = Math.abs(Math.cos(angle))
    const sin = Math.abs(Math.sin(angle))

    const halfW = piece.width / 2
    const halfH = piece.height / 2

    const extentX = halfW * cos + halfH * sin
    const extentY = halfW * sin + halfH * cos

    const centerX = piece.x + halfW
    const centerY = piece.y + halfH

    return {
      left: centerX - extentX,
      right: centerX + extentX,
      top: centerY - extentY,
      bottom: centerY + extentY,
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
            height={piece.height}
            preserveAspectRatio="xMidYMid meet"
            transform={`rotate(
              ${piece.rotation}
              ${piece.x + piece.width / 2}
              ${piece.y + piece.height / 2}
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
