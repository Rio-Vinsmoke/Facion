import type { Product } from '../types/product'
import {
  getProductDisplayImage,
  SAFE_PRODUCT_IMAGE_FALLBACK,
} from '../lib/productUtils'

type WishlistProps = {
  products: Product[]
  favoriteIds: string[]
  onRemove: (productId: string) => void
  onShop: () => void
  userId?: string | null
  onSignIn?: () => void
}

export default function Wishlist({
  products,
  favoriteIds,
  onRemove,
  onShop,
  userId,
  onSignIn,
}: WishlistProps) {
  const favorites = favoriteIds.flatMap(id => {
    const product = products.find(entry => entry.id === id)
    return product ? [product] : []
  })

  return (
    <div className="facion-container" style={{ padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
          Saved Pieces
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-charcoal)' }}>
          My Wishlist ♡
        </h1>
        <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '14px' }}>
          Your handpicked pieces, all in one place.
        </p>
      </div>

      {/* Guest Sync Reminder */}
      {!userId && (
        <div className="guest-sync-notice" role="status">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>ℹ</span>
            <span>
              <strong>Shopping as a guest:</strong> Your wishlist is saved in this browser. Sign in to preserve and synchronize your favorites across all your devices.
            </span>
          </div>
          {onSignIn && (
            <button
              type="button"
              className="secondary-button"
              style={{ fontSize: '12px', padding: '6px 14px' }}
              onClick={onSignIn}
            >
              Sign In to Sync
            </button>
          )}
        </div>
      )}

      {favorites.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--color-sand)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--color-border)',
            maxWidth: '520px',
            margin: '40px auto',
          }}
        >
          <div style={{ fontSize: '42px', color: 'var(--color-muted-light)', marginBottom: '14px' }}>
            ♡
          </div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-charcoal)' }}>
            Your wishlist is empty
          </h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px' }}>
            Discover pieces from our contemporary collection and tap the heart icon to save what you love.
          </p>
          <button type="button" className="primary-button" onClick={onShop}>
            Explore Catalogue
          </button>
        </div>
      ) : (
        <div className="product-grid" style={{ marginTop: '20px' }}>
          {favorites.map(product => (
            <article className="product-card" key={product.id}>
              <div className="product-image-container">
                <img
                  className="product-image"
                  src={getProductDisplayImage(product)}
                  alt={product.name}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget
                    if (target.src !== product.image && product.image) {
                      target.src = product.image
                    } else if (target.src !== SAFE_PRODUCT_IMAGE_FALLBACK) {
                      target.src = SAFE_PRODUCT_IMAGE_FALLBACK
                    }
                  }}
                />
              </div>
              <div className="product-details">
                <span className="product-category">{product.category}</span>
                <h3>{product.name}</h3>
                <strong className="product-price">₹{product.price.toLocaleString('en-IN')}</strong>
                
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onRemove(product.id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  style={{ marginTop: 'auto', width: '100%' }}
                >
                  ♡ Remove from wishlist
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
