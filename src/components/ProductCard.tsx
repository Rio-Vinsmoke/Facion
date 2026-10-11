import type { Product } from '../types/product'
import type { ProductReviewSummary } from '../types/review'

type ProductCardProps = {
  product: Product
  reviewSummary?: ProductReviewSummary
  onSelect: (product: Product) => void
}

function renderStars(rating: number): string {
  const rounded = Math.round(rating)
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded)
}

export default function ProductCard({
  product,
  reviewSummary,
  onSelect,
}: ProductCardProps) {
  const displayImage = product.cutout_image || product.image
  const hasReviews = reviewSummary && reviewSummary.totalReviews > 0

  return (
    <article className="product-card">
      <div className="product-image-container">
        <img
          src={displayImage}
          alt={product.name}
          className="product-image"
          loading="lazy"
          decoding="async"
        />
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
              <span className="rating-score">{reviewSummary.averageRating.toFixed(1)}</span>
              <span className="rating-count">({reviewSummary.totalReviews})</span>
            </span>
          ) : (
            <span className="no-reviews-text">No reviews yet</span>
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
