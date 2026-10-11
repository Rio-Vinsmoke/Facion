import { supabase } from '../lib/supabase'
import type {
  ProductReview,
  ProductReviewSummary,
  NewReviewSubmission,
  ReviewDistribution,
} from '../types/review'

const LOCAL_REVIEWS_STORAGE_KEY = 'facion_local_customer_reviews'

// Curated demo reviews for college presentation showcasing real calculation
const DEMO_REVIEWS: ProductReview[] = [
  {
    id: 'demo-rev-1',
    product_id: 'FAC-IMG-F8697D1655D683FA9B0E0430',
    rating: 5,
    title: 'Graceful drape and beautiful tone',
    review_text:
      'The silhouette is wonderfully flattering and the cut moves naturally. Wore it to an evening dinner and received so many compliments.',
    reviewer_name: 'Ananya S.',
    is_demo: true,
    created_at: '2026-10-02T10:30:00Z',
  },
  {
    id: 'demo-rev-2',
    product_id: 'FAC-IMG-F8697D1655D683FA9B0E0430',
    rating: 4,
    title: 'Great everyday styling',
    review_text:
      'Comfortable fit and high quality stitching. Looks great paired with minimalist sandals or low boots.',
    reviewer_name: 'Mira K.',
    is_demo: true,
    created_at: '2026-09-28T14:15:00Z',
  },
  {
    id: 'demo-rev-3',
    product_id: 'FAC-IMG-7A1941D2F61BECC7F8F41486',
    rating: 5,
    title: 'Airy summer staple',
    review_text:
      'Breezy cut that stays comfortable all day. The color shade matches the photographs accurately.',
    reviewer_name: 'Pooja R.',
    is_demo: true,
    created_at: '2026-10-04T09:00:00Z',
  },
  {
    id: 'demo-rev-4',
    product_id: 'FAC-IMG-ED6E78C4788345C151C3C72C',
    rating: 5,
    title: 'Crisp oxford silhouette',
    review_text:
      'Tailored just right through the shoulders and chest. Works just as well under a blazer as it does untucked with denim.',
    reviewer_name: 'Kabir D.',
    is_demo: true,
    created_at: '2026-09-30T16:20:00Z',
  },
  {
    id: 'demo-rev-5',
    product_id: 'FAC-IMG-ED6E78C4788345C151C3C72C',
    rating: 4,
    title: 'Dependable work shirt',
    review_text:
      'Clean lines and durable feel. Has held up very nicely after multiple wears and washes.',
    reviewer_name: 'Vikram M.',
    is_demo: true,
    created_at: '2026-09-22T11:45:00Z',
  },
  {
    id: 'demo-rev-6',
    product_id: 'FAC-IMG-0195E5804F76140E64E831C9',
    rating: 5,
    title: 'Perfect relaxed everyday tee',
    review_text:
      'The collar holds its structure well and the relaxed boxy cut is spot-on for streetwear pairings.',
    reviewer_name: 'Arjun N.',
    is_demo: true,
    created_at: '2026-10-05T12:00:00Z',
  },
  {
    id: 'demo-rev-7',
    product_id: 'top1',
    rating: 5,
    title: 'Favorite layering piece',
    review_text:
      'The cable knit pattern has lovely texture. Layered it over an oversized poplin shirt for a cozy collegiate look.',
    reviewer_name: 'Tara V.',
    is_demo: true,
    created_at: '2026-09-18T15:30:00Z',
  },
  {
    id: 'demo-rev-8',
    product_id: 'jeans1',
    rating: 4,
    title: 'Solid classic denim',
    review_text:
      'Classic straight fit with good structure. Comfortable around the waist and easy to style with sneakers.',
    reviewer_name: 'Dev P.',
    is_demo: true,
    created_at: '2026-09-25T13:10:00Z',
  },
]

function getLocalStoredReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalReview(review: ProductReview): void {
  try {
    const current = getLocalStoredReviews()
    const next = [review, ...current.filter(r => r.id !== review.id)]
    localStorage.setItem(LOCAL_REVIEWS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Local storage quota or unavailable
  }
}

export function computeReviewSummary(
  productId: string,
  reviews: ProductReview[],
): ProductReviewSummary {
  const distribution: ReviewDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  if (!reviews.length) {
    return {
      productId,
      averageRating: 0,
      totalReviews: 0,
      distribution,
    }
  }

  let totalScore = 0
  for (const rev of reviews) {
    const rating = Math.max(1, Math.min(5, Math.round(rev.rating))) as 1 | 2 | 3 | 4 | 5
    distribution[rating] = (distribution[rating] || 0) + 1
    totalScore += rev.rating
  }

  const averageRating = Number((totalScore / reviews.length).toFixed(1))

  return {
    productId,
    averageRating,
    totalReviews: reviews.length,
    distribution,
  }
}

export async function fetchProductReviews(
  productId: string,
): Promise<{ reviews: ProductReview[]; summary: ProductReviewSummary }> {
  let dbReviews: ProductReview[] = []

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      dbReviews = data as ProductReview[]
    }
  } catch {
    // Table may not yet be created in Supabase
  }

  // Merge database reviews, local browser submissions, and demo reviews
  const localReviews = getLocalStoredReviews().filter(r => r.product_id === productId)
  const defaultDemo = DEMO_REVIEWS.filter(r => r.product_id === productId)

  const seenIds = new Set<string>()
  const merged: ProductReview[] = []

  // Priority: local submissions > database records > demo fallback
  for (const r of [...localReviews, ...dbReviews, ...defaultDemo]) {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id)
      merged.push(r)
    }
  }

  merged.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const summary = computeReviewSummary(productId, merged)
  return { reviews: merged, summary }
}

export async function fetchAllReviewSummaries(): Promise<
  Map<string, ProductReviewSummary>
> {
  const summariesMap = new Map<string, ProductReviewSummary>()
  let allDbReviews: ProductReview[] = []

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, rating, is_demo, created_at')

    if (!error && data) {
      allDbReviews = data as ProductReview[]
    }
  } catch {
    // If table doesn't exist yet
  }

  const localReviews = getLocalStoredReviews()
  const allReviews = [...localReviews, ...allDbReviews, ...DEMO_REVIEWS]

  const byProduct = new Map<string, ProductReview[]>()
  const seenIds = new Set<string>()

  for (const rev of allReviews) {
    if (seenIds.has(rev.id)) continue
    seenIds.add(rev.id)

    const list = byProduct.get(rev.product_id) || []
    list.push(rev)
    byProduct.set(rev.product_id, list)
  }

  for (const [productId, list] of byProduct.entries()) {
    summariesMap.set(productId, computeReviewSummary(productId, list))
  }

  return summariesMap
}

export async function submitProductReview(
  submission: NewReviewSubmission,
  userId?: string | null,
): Promise<ProductReview> {
  const trimmedText = submission.reviewText.trim()
  const trimmedTitle = submission.title?.trim() || null

  if (!trimmedText) {
    throw new Error('Please enter your review comments.')
  }

  if (submission.rating < 1 || submission.rating > 5) {
    throw new Error('Please select a star rating between 1 and 5.')
  }

  const newReview: ProductReview = {
    id: crypto.randomUUID(),
    product_id: submission.productId,
    user_id: userId || null,
    rating: submission.rating,
    title: trimmedTitle,
    review_text: trimmedText,
    reviewer_name: submission.reviewerName || (userId ? 'Verified Customer' : 'Customer'),
    is_demo: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Attempt database save if signed in
  if (userId) {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          id: newReview.id,
          product_id: newReview.product_id,
          user_id: userId,
          rating: newReview.rating,
          title: newReview.title,
          review_text: newReview.review_text,
          reviewer_name: newReview.reviewer_name,
          is_demo: false,
        })
        .select()
        .single()

      if (!error && data) {
        newReview.id = data.id
      }
    } catch {
      // If table doesn't exist yet, save locally
    }
  }

  // Save to browser storage as well so it's instantly visible
  saveLocalReview(newReview)
  return newReview
}
