import { useEffect, useState } from 'react'
import {
  fetchProductReviews,
  submitProductReview,
} from '../data/reviewStorage'
import type {
  ProductReview,
  ProductReviewSummary,
} from '../types/review'

type Props = {
  productId: string
  productName: string
  userId: string | null
  onSignInRequest: () => void
}

function renderStars(rating: number): string {
  const rounded = Math.max(1, Math.min(5, Math.round(rating)))
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded)
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Recently'
  }
}

export default function ProductReviewsSection({
  productId,
  productName,
  userId,
  onSignInRequest,
}: Props) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [summary, setSummary] = useState<ProductReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)

  // Review Form state
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const result = await fetchProductReviews(productId)
        if (!cancelled) {
          setReviews(result.reviews)
          setSummary(result.summary)
        }
      } catch {
        // Fallback silently if offline
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
  }, [productId, reload])

  // Check if current user already submitted a review
  const userExistingReview = userId
    ? reviews.find(r => r.user_id === userId && !r.is_demo)
    : null

  async function handleSubmitReview(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return

    setFormError('')
    setFormSuccess('')

    const trimmedText = reviewText.trim()
    if (!trimmedText) {
      setFormError('Please enter your written review.')
      return
    }

    if (trimmedText.length < 10) {
      setFormError('Please write at least 10 characters describing the garment.')
      return
    }

    setSubmitting(true)

    try {
      await submitProductReview(
        {
          productId,
          rating,
          title: title.trim() || undefined,
          reviewText: trimmedText,
          reviewerName: reviewerName.trim() || undefined,
        },
        userId,
      )

      setFormSuccess('Thank you! Your review has been submitted successfully.')
      setTitle('')
      setReviewText('')
      setReviewerName('')
      setRating(5)

      // Reload reviews
      setReload(r => r + 1)
      setTimeout(() => {
        setShowForm(false)
        setFormSuccess('')
      }, 2000)
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Could not submit your review. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="product-reviews-section" aria-labelledby="reviews-heading">
      <div className="reviews-section-header">
        <div>
          <h3 id="reviews-heading">Ratings & Reviews</h3>
          <p className="reviews-subheading">
            Authentic customer feedback for {productName}
          </p>
        </div>

        {!showForm && (
          <div>
            {userId ? (
              userExistingReview ? (
                <span className="already-reviewed-badge">
                  ✓ You reviewed this item
                </span>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowForm(true)}
                >
                  Write a Review
                </button>
              )
            ) : (
              <button
                type="button"
                className="secondary-button"
                onClick={onSignInRequest}
              >
                Sign in to Write a Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Submission Form Modal / Panel */}
      {showForm && (
        <div className="review-submission-card">
          <h4>Share your review</h4>
          <p className="form-subtext">
            Tell other shoppers about the fit, quality, and styling of this piece.
          </p>

          <form onSubmit={handleSubmitReview}>
            {/* Interactive Star Rating Selector */}
            <div className="star-rating-selector">
              <label>Your Rating *</label>
              <div
                className="interactive-stars"
                role="radiogroup"
                aria-label="Star rating out of 5"
              >
                {[1, 2, 3, 4, 5].map(star => {
                  const activeStar = hoverRating || rating
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= activeStar ? 'filled' : 'empty'}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  )
                })}
                <span className="rating-label-text">
                  {rating === 5 && 'Excellent'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Average'}
                  {rating === 2 && 'Below Average'}
                  {rating === 1 && 'Poor'}
                </span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="review-title">Review Headline (optional)</label>
              <input
                id="review-title"
                type="text"
                placeholder="e.g. Perfect everyday fit, beautiful color"
                value={title}
                maxLength={100}
                onChange={e => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-field">
              <label htmlFor="review-name">Your Display Name (optional)</label>
              <input
                id="review-name"
                type="text"
                placeholder="e.g. Tanya S."
                value={reviewerName}
                maxLength={50}
                onChange={e => setReviewerName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="form-field">
              <label htmlFor="review-body">Written Review *</label>
              <textarea
                id="review-body"
                required
                rows={4}
                placeholder="Describe the fabric feel, drape, sizing, and styling versatility..."
                value={reviewText}
                maxLength={1000}
                onChange={e => setReviewText(e.target.value)}
                disabled={submitting}
              />
              <span className="char-count">{reviewText.length}/1000</span>
            </div>

            {formError && <p className="review-form-error" role="alert">{formError}</p>}
            {formSuccess && <p className="review-form-success" role="status">{formSuccess}</p>}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
              <button
                type="button"
                className="secondary-button"
                disabled={submitting}
                onClick={() => {
                  setShowForm(false)
                  setFormError('')
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="reviews-loading" role="status">Loading reviews...</p>
      ) : summary && summary.totalReviews > 0 ? (
        <>
          {/* Rating Summary & Breakdown Grid */}
          <div className="reviews-summary-grid">
            <div className="overall-score-card">
              <span className="big-score">{summary.averageRating.toFixed(1)}</span>
              <span className="score-stars">{renderStars(summary.averageRating)}</span>
              <span className="total-reviews-count">
                Based on {summary.totalReviews} review{summary.totalReviews !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="rating-distribution-card">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0
                const percent = summary.totalReviews > 0
                  ? Math.round((count / summary.totalReviews) * 100)
                  : 0
                return (
                  <div key={stars} className="distribution-row">
                    <span className="row-star-label">{stars} ★</span>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{ width: `${percent}%` }}
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                    <span className="row-count">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Customer Reviews List */}
          <div className="reviews-list">
            <h4>Customer Reviews ({reviews.length})</h4>
            {reviews.map(review => (
              <article key={review.id} className="review-card">
                <div className="review-card-header">
                  <div className="reviewer-info">
                    <span className="review-stars" aria-label={`${review.rating} out of 5 stars`}>
                      {renderStars(review.rating)}
                    </span>
                    <strong className="reviewer-name">
                      {review.reviewer_name || 'Verified Customer'}
                    </strong>
                    {review.is_demo ? (
                      <span className="sample-review-badge">Sample review</span>
                    ) : (
                      <span className="verified-badge">✓ Verified purchase</span>
                    )}
                  </div>
                  <span className="review-date">{formatDate(review.created_at)}</span>
                </div>

                {review.title && <h5 className="review-title">{review.title}</h5>}
                <p className="review-text">{review.review_text}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-reviews-state">
          <p className="empty-text">No reviews yet for this product.</p>
          <p className="empty-subtext">Be the first to share your experience with this piece!</p>
          {!showForm && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (userId) setShowForm(true)
                else onSignInRequest()
              }}
            >
              {userId ? 'Write the First Review' : 'Sign In to Review'}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
