export type ProductReview = {
  id: string
  product_id: string
  user_id?: string | null
  rating: number
  title?: string | null
  review_text: string
  reviewer_name?: string | null
  is_demo: boolean
  created_at: string
  updated_at?: string | null
}

export type ReviewDistribution = {
  5: number
  4: number
  3: number
  2: number
  1: number
}

export type ProductReviewSummary = {
  productId: string
  averageRating: number
  totalReviews: number
  distribution: ReviewDistribution
}

export type NewReviewSubmission = {
  productId: string
  rating: number
  title?: string
  reviewText: string
  reviewerName?: string
}
