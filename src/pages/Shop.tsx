

import { useEffect, useMemo, useState } from 'react'

import ProductCard from '../components/ProductCard'

import ProductReviewsSection from '../components/ProductReviewsSection'

import {

  fetchProducts,

  getSizeStock,

  getSortedVariants,

} from '../data/productStorage'

import { fetchAllReviewSummaries } from '../data/reviewStorage'

import {
  productCategories,
  type Product,
} from '../types/product'
import type { ProductReviewSummary } from '../types/review'
import {
  matchesProductSearch,
  getProductDisplayImage,
  getProductCategoryClass,
  SAFE_PRODUCT_IMAGE_FALLBACK,
} from '../lib/productUtils'



type ShopProps = {

  userId?: string | null

  onAddToBag: (product: Product, size: string) => void

  onNavigateToAccount?: () => void
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void

}



type SortOption =

  | 'featured'

  | 'price-low'

  | 'price-high'

  | 'name-az'

  | 'name-za'



export default function Shop({

  userId,

  onAddToBag,

  onNavigateToAccount,
  favoriteIds,
  onToggleFavorite,

}: ShopProps) {

  const [products, setProducts] = useState<Product[]>([])

  const [reviewSummaries, setReviewSummaries] = useState<

    Map<string, ProductReviewSummary>

  >(new Map())

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [reload, setReload] = useState(0)



  const [search, setSearch] = useState('')

  const [category, setCategory] = useState('All')

  const [gender, setGender] = useState('All')

  const [sortBy, setSortBy] = useState<SortOption>('featured')

  const [maxPrice, setMaxPrice] = useState('All')

  const [sizeFilter, setSizeFilter] = useState('All')

  const [colorFilter, setColorFilter] = useState('All')



  const [selectedProduct, setSelectedProduct] =

    useState<Product | null>(null)

  const [selectedSize, setSelectedSize] = useState('')



  useEffect(() => {
    let cancelled = false

    async function load() {

      try {

        const [catalogue, summaries] = await Promise.all([

          fetchProducts(),

          fetchAllReviewSummaries().catch(() => new Map()),

        ])



        if (!cancelled) {

          setProducts(catalogue)

          setReviewSummaries(summaries)

        }

      } catch (cause) {

        if (!cancelled) {

          const details =

            cause &&

            typeof cause === 'object' &&

            'message' in cause &&

            typeof cause.message === 'string'

              ? cause.message

              : 'Please try again.'



          setError(`Could not load products. ${details}`)

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



  const availableSizes = useMemo(() => {

    const sizes = new Set<string>()



    products.forEach(product => {

      product.variants?.forEach(variant => {

        if (variant.stock > 0) {

          sizes.add(variant.size)

        }

      })

    })



    const clothingOrder = [

      'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',

    ]



    return [...sizes].sort((a, b) => {
      const first = clothingOrder.indexOf(a)
      const second = clothingOrder.indexOf(b)

      if (first !== -1 && second !== -1) {
        return first - second
      }

      if (first !== -1) return -1
      if (second !== -1) return 1

      return a.localeCompare(b, 'en', { numeric: true })
    })
  }, [products])

  const availableColors = useMemo(() => {
    const colors = new Set<string>()
    products.forEach(product => {
      if (product.color) {
        const trimmed = product.color.trim()
        if (trimmed) {
          colors.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase())
        }
      }
    })
    return [...colors].sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    const priceLimit =
      maxPrice === 'All' ? Infinity : Number(maxPrice)

    const matches = products.filter(product => {
      const matchesSearch = matchesProductSearch(product, search)

      const matchesCategory =
        category === 'All' || product.category === category

      const matchesGender =
        gender === 'All' ||
        (product.gender ?? 'Unisex') === gender

      const matchesColor =
        colorFilter === 'All' ||
        (Boolean(product.color) &&
          product.color!.trim().toLowerCase() === colorFilter.toLowerCase())

      const matchesPrice = product.price <= priceLimit

      const matchesSize =
        sizeFilter === 'All' ||
        (product.variants ?? []).some(
          variant =>
            variant.size === sizeFilter &&
            variant.stock > 0,
        )

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGender &&
        matchesColor &&
        matchesPrice &&
        matchesSize
      )
    })

    return matches.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price

        case 'price-high':
          return b.price - a.price

        case 'name-az':
          return a.name.localeCompare(b.name)

        case 'name-za':
          return b.name.localeCompare(a.name)

        default:
          return 0
      }
    })
  }, [
    products,
    search,
    category,
    gender,
    colorFilter,
    maxPrice,
    sizeFilter,
    sortBy,
  ])

  function openProduct(product: Product) {
    setSelectedSize('')
    setSelectedProduct(product)
  }

  function resetFilters() {
    setSearch('')
    setCategory('All')
    setGender('All')
    setColorFilter('All')
    setSortBy('featured')
    setMaxPrice('All')
    setSizeFilter('All')
  }



  if (loading) {

    return (

      <section>

        <h2>Shop</h2>

        <p role="status">Loading products...</p>

      </section>

    )

  }



  if (error) {

    return (

      <section>

        <h2>Shop</h2>

        <p role="alert">{error}</p>



        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setLoading(true)
            setError('')
            setReload(value => value + 1)
          }}
        >
          Try again
        </button>

      </section>

    )

  }



  if (selectedProduct) {

    const variants = getSortedVariants(selectedProduct)

    const selectedStock = getSizeStock(

      selectedProduct,

      selectedSize,

    )

    const soldOut = !variants.some(

      variant => variant.stock > 0,

    )



    return (

      <>

        <button

          type="button"

          className="secondary-button"

          onClick={() => setSelectedProduct(null)}

        >

          ← Back to shop

        </button>



        <div className="product-view">
          <div
            className={`product-view-image-container ${getProductCategoryClass(selectedProduct.category)}`}
          >
            <img
              className="product-view-image"
              src={getProductDisplayImage(selectedProduct)}
              alt={selectedProduct.name}
              onError={(e) => {
                const target = e.currentTarget
                if (target.src !== selectedProduct.image && selectedProduct.image) {
                  target.src = selectedProduct.image
                } else if (target.src !== SAFE_PRODUCT_IMAGE_FALLBACK) {
                  target.src = SAFE_PRODUCT_IMAGE_FALLBACK
                }
              }}
            />
          </div>



          <section className="product-view-details">

            <p>

              {selectedProduct.gender ?? 'Unisex'} ·{' '}

              {selectedProduct.category}

            </p>



            <h2>{selectedProduct.name}</h2>



            {(() => {

              const selectedSummary = reviewSummaries.get(selectedProduct.id)

              if (selectedSummary && selectedSummary.totalReviews > 0) {

                const rounded = Math.round(selectedSummary.averageRating)

                return (

                  <div className="product-view-rating">

                    <span className="stars-icons" aria-hidden="true">

                      {'★'.repeat(rounded) + '☆'.repeat(5 - rounded)}

                    </span>

                    <strong className="rating-score">{selectedSummary.averageRating.toFixed(1)}</strong>

                    <span className="rating-count">

                      ({selectedSummary.totalReviews} review{selectedSummary.totalReviews !== 1 ? 's' : ''})

                    </span>

                  </div>

                )

              }

              return (

                <div className="product-view-rating no-reviews">

                  <span className="no-reviews-text">No reviews yet</span>

                </div>

              )

            })()}



            <strong className="product-price">

              ₹{selectedProduct.price.toLocaleString('en-IN')}

            </strong>



            {variants.length > 0 ? (

              <fieldset className="size-selector">

                <legend>Choose your size</legend>



                {variants.map(variant => (

                  <label

                    key={variant.size}

                    className="size-option"

                  >

                    <input

                      type="radio"

                      name="size"

                      value={variant.size}

                      checked={selectedSize === variant.size}

                      disabled={variant.stock === 0}

                      onChange={() =>

                        setSelectedSize(variant.size)

                      }

                    />



                    <span>

                      {variant.size}

                      {variant.stock === 0

                        ? ' — Sold out'

                        : ''}

                    </span>

                  </label>

                ))}

              </fieldset>

            ) : (

              <p>

                No sizes are available for this product yet.

              </p>

            )}



            <button

              type="button"

              className="primary-button"

              disabled={!selectedSize || selectedStock === 0}

              onClick={() => {

                if (selectedStock < 1) return



                onAddToBag(selectedProduct, selectedSize)

                setSelectedProduct(null)

              }}

            >

              {soldOut ? 'Unavailable' : 'Add to bag'}

            </button>



            <p role="status">

              {soldOut

                ? 'This product is currently unavailable to purchase.'

                : selectedSize

                  ? `Size ${selectedSize}: ${selectedStock} available.`

                  : 'Select an available size to continue.'}

            </p>

          </section>

        </div>



        <ProductReviewsSection

          productId={selectedProduct.id}

          productName={selectedProduct.name}

          userId={userId ?? null}

          onSignInRequest={() => onNavigateToAccount?.()}

        />

      </>

    )

  }



  const hasActiveFilters =
    Boolean(search.trim()) ||
    category !== 'All' ||
    gender !== 'All' ||
    colorFilter !== 'All' ||
    maxPrice !== 'All' ||
    sizeFilter !== 'All'

  return (
    <>
      <h2>Shop</h2>
      <p>Discover your next favourite piece.</p>

      <div className="shop-filters">
        <label>
          Search products
          <div className="shop-search-wrapper">
            <input
              type="search"
              placeholder="Search clothes, shoes and accessories"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                className="shop-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}
          </div>
        </label>

        <label>
          Collection
          <select
            value={gender}
            onChange={event => setGender(event.target.value)}
          >
            <option value="All">All collections</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Unisex">Unisex</option>
          </select>
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option value="All">All categories</option>
            {productCategories.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label>
          Colour
          <select
            value={colorFilter}
            onChange={event => setColorFilter(event.target.value)}
          >
            <option value="All">All colours</option>
            {availableColors.map(col => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </label>

        <label>
          Maximum price
          <select
            value={maxPrice}
            onChange={event => setMaxPrice(event.target.value)}
          >
            <option value="All">Any price</option>
            <option value="499">Under ₹500</option>
            <option value="999">Under ₹1,000</option>
            <option value="1999">Under ₹2,000</option>
            <option value="2999">Under ₹3,000</option>
            <option value="4999">Under ₹5,000</option>
          </select>
        </label>

        <label>
          Available size
          <select
            value={sizeFilter}
            onChange={event => setSizeFilter(event.target.value)}
          >
            <option value="All">All sizes</option>
            {availableSizes.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort by
          <select
            value={sortBy}
            onChange={event =>
              setSortBy(event.target.value as SortOption)
            }
          >
            <option value="featured">Featured</option>
            <option value="price-low">
              Price: Low to High
            </option>
            <option value="price-high">
              Price: High to Low
            </option>
            <option value="name-az">
              Name: A to Z
            </option>
            <option value="name-za">
              Name: Z to A
            </option>
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <div className="active-filters-bar" aria-label="Active filters">
          <span className="active-filters-label">Active filters:</span>
          {search.trim() && (
            <span className="filter-chip">
              Search: "{search.trim()}"
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Remove search filter"
              >
                ✕
              </button>
            </span>
          )}
          {gender !== 'All' && (
            <span className="filter-chip">
              Collection: {gender}
              <button
                type="button"
                onClick={() => setGender('All')}
                aria-label="Remove collection filter"
              >
                ✕
              </button>
            </span>
          )}
          {category !== 'All' && (
            <span className="filter-chip">
              Category: {category}
              <button
                type="button"
                onClick={() => setCategory('All')}
                aria-label="Remove category filter"
              >
                ✕
              </button>
            </span>
          )}
          {colorFilter !== 'All' && (
            <span className="filter-chip">
              Colour: {colorFilter}
              <button
                type="button"
                onClick={() => setColorFilter('All')}
                aria-label="Remove colour filter"
              >
                ✕
              </button>
            </span>
          )}
          {maxPrice !== 'All' && (
            <span className="filter-chip">
              Under ₹{maxPrice}
              <button
                type="button"
                onClick={() => setMaxPrice('All')}
                aria-label="Remove price filter"
              >
                ✕
              </button>
            </span>
          )}
          {sizeFilter !== 'All' && (
            <span className="filter-chip">
              Size: {sizeFilter}
              <button
                type="button"
                onClick={() => setSizeFilter('All')}
                aria-label="Remove size filter"
              >
                ✕
              </button>
            </span>
          )}
          <button
            type="button"
            className="clear-all-filters-btn"
            onClick={resetFilters}
          >
            Clear all
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          margin: '18px 0',
        }}
      >
        <p role="status" style={{ margin: 0 }}>
          {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} found
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            className="secondary-button"
            onClick={resetFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="product-grid">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            reviewSummary={reviewSummaries.get(product.id)}
            onSelect={openProduct}
            isFavorite={favoriteIds.includes(product.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {products.length === 0 ? (
        <div className="shop-empty-state">
          <p>No products are available yet.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="shop-empty-state" role="status">
          <p className="shop-empty-title">No products match your search or filters.</p>
          <p className="shop-empty-subtitle">
            {hasActiveFilters
              ? 'Try clearing one or more active filters above to expand your results.'
              : 'Try searching with different keywords.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="secondary-button"
              onClick={resetFilters}
            >
              Reset all filters
            </button>
          )}
        </div>
      ) : null}
    </>

  )

}
