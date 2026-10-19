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
}

export default function Bag({
  items,
  onQuantityChange,
  onRemove,
  onCheckout,
}: BagProps) {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const hasStockIssue = items.some(
    item => item.quantity > getSizeStock(item.product, item.size),
  )

  return (
    <>
      <h2>Your Bag</h2>

      {items.length === 0 && <p>Your bag is empty.</p>}

      {hasStockIssue && (
        <p role="alert">
          Some items exceed available stock. Reduce their quantity
          or remove sold-out items.
        </p>
      )}

      {items.map(({ product, size, quantity }) => {
        const stock = getSizeStock(product, size)
        const limit = Math.min(stock, 10)
        const exceedsStock = quantity > stock

        return (
          <article className="bag-item" key={`${product.id}-${size}`}>
            <img
              src={getProductDisplayImage(product)}
              alt={product.name}
              onError={(e) => {
                const target = e.currentTarget
                if (target.src !== product.image && product.image) {
                  target.src = product.image
                } else if (target.src !== SAFE_PRODUCT_IMAGE_FALLBACK) {
                  target.src = SAFE_PRODUCT_IMAGE_FALLBACK
                }
              }}
            />

            <div>
              <h3>{product.name}</h3>
              <p>Size: {size}</p>
              <p>₹{product.price.toLocaleString('en-IN')} each</p>

              {stock === 0 ? (
                <p role="alert">
                  This size is sold out. Please remove it from your bag.
                </p>
              ) : (
                <>
                  <label>
                    Quantity{' '}
                    <select
                      value={quantity}
                      onChange={event =>
                        onQuantityChange(
                          product.id,
                          size,
                          Number(event.target.value),
                        )
                      }
                    >
                      {quantity > limit && (
                        <option value={quantity} disabled>
                          {quantity} — reduce quantity
                        </option>
                      )}

                      {Array.from(
                        { length: limit },
                        (_, index) => index + 1,
                      ).map(value => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>

                  <p>{stock} available in this size.</p>

                  {exceedsStock && (
                    <p role="alert">
                      Only {stock} available. Reduce your quantity.
                    </p>
                  )}
                </>
              )}

              <p>
                Subtotal: ₹
                {(product.price * quantity).toLocaleString('en-IN')}
              </p>

              <button
                className="secondary-button"
                onClick={() => onRemove(product.id, size)}
              >
                Remove
              </button>
            </div>
          </article>
        )
      })}

      {items.length > 0 && (
        <>
          <p className="product-price" role="status">
            Total: ₹{total.toLocaleString('en-IN')}
          </p>

          <p>Items in your bag do not reserve stock.</p>

          <button
            className="primary-button"
            disabled={hasStockIssue}
            onClick={onCheckout}
          >
            Proceed to checkout
          </button>
        </>
      )}
    </>
  )
}