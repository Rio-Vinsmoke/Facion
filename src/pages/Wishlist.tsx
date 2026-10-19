import type { Product } from '../types/product'
import {
  getProductDisplayImage,
  SAFE_PRODUCT_IMAGE_FALLBACK,
} from '../lib/productUtils'

type Props = {
  products: Product[]
  favoriteIds: string[]
  onRemove: (productId: string) => void
  onShop: () => void
}

export default function Wishlist({ products, favoriteIds, onRemove, onShop }: Props) {
  const favorites = favoriteIds.flatMap(id => {
    const product = products.find(entry => entry.id === id)
    return product ? [product] : []
  })

  return (
    <section>
      <h2>My Wishlist ♡</h2>
      <p>Your favorite pieces, all in one place.</p>
      {favorites.length === 0 ? (
        <div>
          <p>No favorites yet. Explore the Shop and save pieces you love.</p>
          <button type="button" className="primary-button" onClick={onShop}>Explore Shop</button>
        </div>
      ) : (
        <div className="product-grid">
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
                
                <button type="button" className="secondary-button" onClick={() => onRemove(product.id)} aria-label={`Remove ${product.name} from wishlist`}>♡ Remove favorite</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
