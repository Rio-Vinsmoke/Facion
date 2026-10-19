
import { useState } from 'react'
import type { Product } from '../types/product'
import type { ProductReviewSummary } from '../types/review'
import {
  getProductDisplayImage,
  getProductCategoryClass,
  SAFE_PRODUCT_IMAGE_FALLBACK,
} from '../lib/productUtils'

type ProductCardProps = {
  product: Product
  reviewSummary?: ProductReviewSummary
  onSelect: (product: Product) => void
  isFavorite?: boolean
  onToggleFavorite?: (productId: string) => void
}

function renderStars(rating: number): string {
  const rounded = Math.round(rating)
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded)
}

export default function ProductCard({
  product,
  reviewSummary,
  onSelect,
  isFavorite = false,
  onToggleFavorite,
}: ProductCardProps) {
  const initialImage = getProductDisplayImage(product)
  const [imageSrc, setImageSrc] = useState(initialImage)
  const [prevProductKey, setPrevProductKey] = useState(
    `${product.id}-${product.cutout_image}-${product.image}`,
  )

  const currentProductKey = `${product.id}-${product.cutout_image}-${product.image}`
  if (prevProductKey !== currentProductKey) {
    setPrevProductKey(currentProductKey)
    setImageSrc(initialImage)
  }

  const hasReviews = reviewSummary && reviewSummary.totalReviews > 0

  return (
    <article className="product-card">
      <div
        className={`product-image-container ${getProductCategoryClass(product.category)}`}
        style={{ position: 'relative' }}
      >
        <img
          src={imageSrc}
          alt={product.name}
          className="product-image"
          loading="lazy"
          decoding="async"
          onError={() => {
            if (imageSrc !== product.image && product.image) {
              setImageSrc(product.image)
            } else if (imageSrc !== SAFE_PRODUCT_IMAGE_FALLBACK) {
              setImageSrc(SAFE_PRODUCT_IMAGE_FALLBACK)
            }
          }}
        />

        {onToggleFavorite && (
          <button
            type="button"
            className={`product-wishlist-heart ${
              isFavorite ? 'is-favorite' : ''
            }`}
            aria-label={
              isFavorite
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            aria-pressed={isFavorite}
            title={
              isFavorite
                ? 'Remove from wishlist'
                : 'Add to wishlist'
            }
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite(product.id)
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
            </svg>
          </button>
        )}
      </div>

      <div className="product-details">
        <span className="product-category">
          {product.category}
        </span>

        <h3>{product.name}</h3>

        <div className="product-card-rating">
          {hasReviews ? (
            <span
              className="rating-badge"
              aria-label={`Rated ${reviewSummary.averageRating} out of 5 stars from ${reviewSummary.totalReviews} reviews`}
            >
              <span className="stars-icons" aria-hidden="true">
                {renderStars(reviewSummary.averageRating)}
              </span>
              <span className="rating-score">
                {reviewSummary.averageRating.toFixed(1)}
              </span>
              <span className="rating-count">
                ({reviewSummary.totalReviews})
              </span>
            </span>
          ) : (
            <span className="no-reviews-text">
              No reviews yet
            </span>
          )}
        </div>

        <strong className="product-price">
          ₹{product.price.toLocaleString('en-IN')}
        </strong>

        <button
          type="button"
          className="primary-button"
          onClick={() => onSelect(product)}
        >
          View product
        </button>
      </div>
    </article>
  )
}
