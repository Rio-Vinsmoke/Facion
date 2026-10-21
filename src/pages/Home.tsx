import { useMemo } from 'react'
import type { Product } from '../types/product'
import ProductCard from '../components/ProductCard'
import type { Page } from '../components/Header'
import './Home.css'

type HomeProps = {
  catalogue: Product[]
  onNavigate: (page: Page, options?: { category?: string; gender?: string; search?: string }) => void
  favoriteIds: string[]
  onToggleFavorite: (productId: string) => void
  onSelectProduct: (product: Product) => void
}

export default function Home({
  catalogue,
  onNavigate,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
}: HomeProps) {
  // Select top 5 featured items from catalogue
  const featuredProducts = useMemo(() => {
    if (!catalogue || catalogue.length === 0) return []
    // Take a curated selection of products across categories
    return catalogue.slice(0, 5)
  }, [catalogue])

  return (
    <div className="facion-homepage">
      {/* ----------------------------------------------------------------------
          1. Hero Campaign Section (Faithful to Reference Image)
          ---------------------------------------------------------------------- */}
      <section className="facion-hero" aria-label="Campaign Hero">
        <div className="facion-hero-overlay" />

        <div className="facion-hero-top">
          <div className="facion-hero-microcopy">
            Clothes<br />
            for a brighter<br />
            version of you.
          </div>
          <div className="facion-hero-microcopy text-right">
            Casual<br />
            Iconic<br />
            Always yours
          </div>
        </div>

        <div className="facion-hero-center">
          <h1 className="facion-hero-title">FACION</h1>
        </div>

        <div className="facion-hero-bottom">
          <button
            type="button"
            className="glass-glow-btn"
            onClick={() => onNavigate('Shop')}
          >
            Shop Now <span>→</span>
          </button>
          <button
            type="button"
            className="glass-glow-btn"
            onClick={() => onNavigate('Outfit Studio')}
          >
            Build an Outfit <span>→</span>
          </button>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          2. Editorial Collage / Philosophy Section
          ---------------------------------------------------------------------- */}
      <section className="facion-collage-section">
        <div className="facion-container">
          <div className="facion-collage-grid">
            <div className="facion-collage-text">
              <h3>FACION™</h3>
              <p>Everyday pieces.<br />Bigger stories.</p>
            </div>

            <div className="facion-collage-visuals">
              <div className="facion-collage-photo photo-1">
                <img
                  src="/images/campaign/editorial-burgundy-portrait.png"
                  alt="Editorial portrait in burgundy knitwear"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="facion-collage-photo photo-2">
                <img
                  src="/images/campaign/graphic-tee-campaign.png"
                  alt="Good People Better Days graphic tee"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="facion-handwriting-note" aria-hidden="true">
                style lives here <span className="facion-slash-mark">/ /</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          3. Featured Collection Section ("Late Summer Collection")
          ---------------------------------------------------------------------- */}
      <section className="facion-featured-collection" aria-label="Featured Collection">
        <div className="facion-container">
          <div className="facion-collection-header">
            <div className="facion-section-label">Featured Collection</div>
            <h2 className="facion-collection-title">
              Late Summer <span>Collection</span>
            </h2>
            <div className="facion-collection-subtext">
              Familiar fits. New places.
            </div>
            <button
              type="button"
              className="facion-editorial-link"
              onClick={() => onNavigate('Collections')}
            >
              Shop the Collection <span>→</span>
            </button>
          </div>

          <div className="facion-polaroid-stage">
            <div className="facion-polaroid-index" aria-hidden="true">
              01 / 03
            </div>

            {/* Polaroid 1: Man in Graphic Tee */}
            <div className="facion-polaroid card-1">
              <img
                src="/images/campaign/featured-collection-man.png"
                alt="Men's collection graphic tee"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Polaroid 2: Poolside Lounge */}
            <div className="facion-polaroid card-2">
              <img
                src="/images/campaign/collection-poolside.png"
                alt="Summer poolside look"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Hotspot 1: Relaxed Logo Sweatshirt */}
            <div
              className="facion-hotspot-card"
              style={{ top: '60px', right: '34%' }}
              onClick={() => onNavigate('Shop', { category: 'Hoodies' })}
              role="button"
              tabIndex={0}
              aria-label="Shop Relaxed Logo Sweatshirt"
            >
              <span className="facion-hotspot-badge">+</span>
              <div className="facion-hotspot-info">
                <span className="facion-hotspot-title">Relaxed Logo Sweatshirt</span>
                <span className="facion-hotspot-price">₹1,499</span>
              </div>
            </div>

            {/* Hotspot 2: Wide Leg Denim */}
            <div
              className="facion-hotspot-card"
              style={{ bottom: '80px', right: '32%' }}
              onClick={() => onNavigate('Shop', { category: 'Jeans' })}
              role="button"
              tabIndex={0}
              aria-label="Shop Wide Leg Denim"
            >
              <span className="facion-hotspot-badge">+</span>
              <div className="facion-hotspot-info">
                <span className="facion-hotspot-title">Wide Leg Denim</span>
                <span className="facion-hotspot-price">₹1,899</span>
              </div>
            </div>

            {/* Polaroid 3: Burgundy Jacket */}
            <div className="facion-polaroid card-3">
              <img
                src="/images/campaign/burgundy-jacket-campaign.png"
                alt="Burgundy jacket campaign portrait"
                loading="lazy"
                decoding="async"
              />
            </div>

            {/* Handwritten script annotation */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '4%',
                fontFamily: 'var(--font-handwriting)',
                fontSize: '28px',
                color: 'var(--color-charcoal)',
                transform: 'rotate(4deg)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            >
              good outfits better days
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          4. Outfit Builder Feature Section (Deep Burgundy #4D1222)
          ---------------------------------------------------------------------- */}
      <section className="facion-outfit-promo-banner" aria-label="Outfit Builder Feature">
        <div className="facion-container">
          <div className="facion-outfit-promo-grid">
            {/* Left Copy */}
            <div className="facion-outfit-promo-copy">
              <div className="facion-section-label">Feature</div>
              <h2 className="facion-outfit-promo-title">
                <em>Outfit</em> Builder
              </h2>
              <p className="facion-outfit-promo-tagline">
                Mix. Match. Make It Yours.
              </p>
              <button
                type="button"
                className="glass-glow-btn light"
                onClick={() => onNavigate('Outfit Studio')}
              >
                Start Building <span>→</span>
              </button>
            </div>

            {/* Center Phone Mockup displaying FACION Outfit Builder */}
            <div className="facion-phone-mockup" aria-hidden="true">
              <div className="facion-phone-header">
                <span>‹</span>
                <span>FACION</span>
                <span>···</span>
              </div>
              <div className="facion-phone-tabs">
                <span className="facion-phone-tab active">Outfit Builder</span>
                <span className="facion-phone-tab">My Looks</span>
                <span className="facion-phone-tab">Saved</span>
              </div>
              <div className="facion-phone-canvas-grid">
                <div className="facion-phone-piece">
                  <img src="/images/campaign/burgundy-jacket-campaign.png" alt="" />
                </div>
                <div className="facion-phone-piece">
                  <img src="/images/campaign/graphic-tee-campaign.png" alt="" />
                </div>
                <div className="facion-phone-piece">
                  <img src="/images/campaign/featured-collection-man.png" alt="" />
                </div>
                <div className="facion-phone-piece">
                  <img src="/images/campaign/editorial-burgundy-portrait.png" alt="" />
                </div>
              </div>
              <button
                type="button"
                className="facion-phone-cta"
                onClick={() => onNavigate('Outfit Studio')}
              >
                Generate Look ✦
              </button>
            </div>

            {/* Right Side Taped Polaroid & Mini Stack */}
            <div className="facion-outfit-promo-right">
              <div className="facion-taped-portrait">
                <div className="facion-tape-strip" />
                <img
                  src="/images/campaign/outfit-builder-campaign.png"
                  alt="Styling composition"
                  loading="lazy"
                  decoding="async"
                />
                <span className="script-text">YOUR STYLE NO RULES</span>
              </div>

              <div className="facion-outfit-mini-stack">
                <div className="facion-mini-thumb">
                  <img src="/images/campaign/featured-collection-man.png" alt="" />
                </div>
                <div className="facion-mini-thumb">
                  <img src="/images/campaign/burgundy-jacket-campaign.png" alt="" />
                </div>
                <div className="facion-mini-thumb">
                  <img src="/images/campaign/collection-poolside.png" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          5. Featured Products Row (Real Catalogue Data via ProductCard)
          ---------------------------------------------------------------------- */}
      <section className="facion-featured-products-section" aria-label="Featured Products">
        <div className="facion-container">
          <div className="facion-section-header">
            <h2 className="facion-section-heading">Featured Products</h2>
            <button
              type="button"
              className="facion-view-all-btn"
              onClick={() => onNavigate('Shop')}
            >
              View All <span>→</span>
            </button>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="product-grid" style={{ marginTop: 0 }}>
              {featuredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  isFavorite={favoriteIds.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-muted)' }}>Loading products from catalogue...</p>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          6. Shop by Category (5 Photographic Cards)
          ---------------------------------------------------------------------- */}
      <section className="facion-shop-by-cat-section" aria-label="Shop by Category">
        <div className="facion-container">
        <div className="facion-section-header">
          <h2 className="facion-section-heading">Shop By Category</h2>
          <button
            type="button"
            className="facion-view-all-btn"
            onClick={() => onNavigate('Categories')}
          >
            View All <span>→</span>
          </button>
        </div>

        <div className="facion-category-grid-5">
          {/* Card 1: Tops */}
          <div
            className="facion-category-card"
            onClick={() => onNavigate('Shop', { category: 'Tops' })}
            role="button"
            tabIndex={0}
            aria-label="Shop Tops category"
          >
            <img
              src="/images/campaign/graphic-tee-campaign.png"
              alt="Tops category"
              loading="lazy"
              decoding="async"
            />
            <div className="facion-category-overlay">
              <span className="facion-category-label">
                Tops <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 2: Outerwear / Hoodies */}
          <div
            className="facion-category-card"
            onClick={() => onNavigate('Shop', { category: 'Hoodies' })}
            role="button"
            tabIndex={0}
            aria-label="Shop Outerwear & Hoodies category"
          >
            <img
              src="/images/campaign/burgundy-jacket-campaign.png"
              alt="Outerwear category"
              loading="lazy"
              decoding="async"
            />
            <div className="facion-category-overlay">
              <span className="facion-category-label">
                Outerwear <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 3: Bottoms & Jeans */}
          <div
            className="facion-category-card"
            onClick={() => onNavigate('Shop', { category: 'Jeans' })}
            role="button"
            tabIndex={0}
            aria-label="Shop Bottoms & Jeans category"
          >
            <img
              src="/images/campaign/featured-collection-man.png"
              alt="Bottoms category"
              loading="lazy"
              decoding="async"
            />
            <div className="facion-category-overlay">
              <span className="facion-category-label">
                Bottoms <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 4: Dresses */}
          <div
            className="facion-category-card"
            onClick={() => onNavigate('Shop', { category: 'Dresses' })}
            role="button"
            tabIndex={0}
            aria-label="Shop Dresses category"
          >
            <img
              src="/images/campaign/collection-poolside.png"
              alt="Dresses category"
              loading="lazy"
              decoding="async"
            />
            <div className="facion-category-overlay">
              <span className="facion-category-label">
                Dresses <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 5: Shirts & Tailoring */}
          <div
            className="facion-category-card"
            onClick={() => onNavigate('Shop', { category: 'Shirts' })}
            role="button"
            tabIndex={0}
            aria-label="Shop Shirts category"
          >
            <img
              src="/images/campaign/editorial-burgundy-portrait.png"
              alt="Shirts category"
              loading="lazy"
              decoding="async"
            />
            <div className="facion-category-overlay">
              <span className="facion-category-label">
                Shirts <span>→</span>
              </span>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          7. Style Stories Section (3 Columns)
          ---------------------------------------------------------------------- */}
      <section className="facion-stories-section" aria-label="Style Stories">
        <div className="facion-container">
          <div className="facion-section-header">
          <h2 className="facion-section-heading">Style Stories</h2>
          <button
            type="button"
            className="facion-view-all-btn"
            onClick={() => onNavigate('Collections')}
          >
            Explore More <span>→</span>
          </button>
        </div>

        <div className="facion-stories-grid">
          {/* Story 1 */}
          <article
            className="facion-story-card"
            onClick={() => onNavigate('Collections')}
          >
            <div className="facion-story-image-wrap">
              <img
                src="/images/campaign/story-poolside.png"
                alt="Poolside State of Mind"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="facion-story-meta">
              <h3 className="facion-story-title">Poolside State of Mind</h3>
              <span className="facion-story-cta">View Story →</span>
            </div>
          </article>

          {/* Story 2 */}
          <article
            className="facion-story-card"
            onClick={() => onNavigate('Collections')}
          >
            <div className="facion-story-image-wrap">
              <img
                src="/images/campaign/collections-group.png"
                alt="Good People, Better Days"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="facion-story-meta">
              <h3 className="facion-story-title">Good People, Better Days</h3>
              <span className="facion-story-cta">View Story →</span>
            </div>
          </article>

          {/* Story 3 */}
          <article
            className="facion-story-card"
            onClick={() => onNavigate('Collections')}
          >
            <div className="facion-story-image-wrap">
              <img
                src="/images/campaign/story-indoor.png"
                alt="Same Fits, Different Places"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="facion-story-meta">
              <h3 className="facion-story-title">Same Fits, Different Places</h3>
              <span className="facion-story-cta">View Story →</span>
            </div>
          </article>
        </div>
        </div>
      </section>
    </div>
  )
}
