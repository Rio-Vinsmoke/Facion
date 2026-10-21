import { getSizeStock } from '../data/productStorage'
import type { CartItem } from '../types/cart'
import {
  getProductDisplayImage,
  SAFE_PRODUCT_IMAGE_FALLBACK,
} from '../lib/productUtils'

type BagProps = {
  items: CartItem[]
  onQuantityChange: (
    productId: string,
    size: string,
    quantity: number,
  ) => void
  onRemove: (productId: string, size: string) => void
  onCheckout: () => void
  onShop?: () => void
}

export default function Bag({
  items,
  onQuantityChange,
  onRemove,
  onCheckout,
  onShop,
}: BagProps) {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const hasStockIssue = items.some(
    item => item.quantity > getSizeStock(item.product, item.size),
  )

  return (
    <div className="facion-container" style={{ padding: '40px 24px 80px' }}>
      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
          Your Selection
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-charcoal)' }}>
          Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})
        </h1>
        <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '14px' }}>
          Review your items and proceed to secure checkout.
        </p>
      </div>

      {hasStockIssue && (
        <div style={{ padding: '14px 20px', background: '#fff5f5', border: '1px solid #ffd8d8', borderRadius: 'var(--radius-sm)', color: '#c92a2a', marginBottom: '24px', fontSize: '13px' }} role="alert">
          Some items exceed currently available stock. Please reduce their quantity or remove sold-out items to proceed.
        </div>
      )}

      {items.length === 0 ? (
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
            🛍
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: '0 0 8px', color: 'var(--color-charcoal)' }}>
            Your bag is empty
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px' }}>
            Browse our catalogue to add contemporary garments to your bag.
          </p>
          {onShop && (
            <button type="button" className="primary-button" onClick={onShop}>
              Explore Catalogue
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Left Column: Items */}
          <div>
            {items.map(({ product, size, quantity }) => {
              const stock = getSizeStock(product, size)
              const limit = Math.min(stock, 10)
              const exceedsStock = quantity > stock

              return (
                <article
                  key={`${product.id}-${size}`}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    padding: '20px',
                    marginBottom: '16px',
                    background: 'var(--color-sand)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ width: '110px', height: '140px', background: '#ffffff', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={getProductDisplayImage(product)}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
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

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {product.category}
                        </span>
                        <h3 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                          {product.name}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-muted)' }}>
                          Size: <strong>{size}</strong>
                        </p>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {stock === 0 ? (
                      <p style={{ color: '#c92a2a', fontSize: '12px', margin: '4px 0' }} role="alert">
                        This size is sold out. Please remove it from your bag.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
                        <label style={{ fontSize: '13px', color: 'var(--color-charcoal)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Qty
                          <select
                            value={quantity}
                            onChange={event =>
                              onQuantityChange(
                                product.id,
                                size,
                                Number(event.target.value),
                              )
                            }
                            style={{
                              padding: '6px 12px',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--color-white)',
                              fontFamily: 'inherit',
                            }}
                          >
                            {quantity > limit && (
                              <option value={quantity} disabled>
                                {quantity} — reduce
                              </option>
                            )}
                            {Array.from({ length: limit }, (_, index) => index + 1).map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </label>

                        <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                          {stock} in stock
                        </span>
                      </div>
                    )}

                    {exceedsStock && (
                      <p style={{ color: '#c92a2a', fontSize: '12px', margin: 0 }} role="alert">
                        Only {stock} available in stock.
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
                        Subtotal: <strong style={{ color: 'var(--color-charcoal)' }}>₹{(product.price * quantity).toLocaleString('en-IN')}</strong>
                      </span>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => onRemove(product.id, size)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Right Column: Order Summary Card */}
          <aside
            style={{
              background: 'var(--color-sand)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, margin: '0 0 20px', color: 'var(--color-charcoal)' }}>
              Order Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted)' }}>
                <span>Subtotal</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted)' }}>
                <span>Estimated Standard Delivery</span>
                <span style={{ color: '#2b8a3e', fontWeight: 600 }}>Complimentary</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-muted)' }}>
                <span>Taxes</span>
                <span>Included</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '20px 0 24px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                Total
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-burgundy)' }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 20px', lineHeight: '1.4' }}>
              Items in your bag do not reserve stock. Stock will be confirmed at checkout.
            </p>

            <button
              type="button"
              className="primary-button"
              style={{ width: '100%', padding: '14px', fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              disabled={hasStockIssue}
              onClick={onCheckout}
            >
              Proceed to Checkout <span>→</span>
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}