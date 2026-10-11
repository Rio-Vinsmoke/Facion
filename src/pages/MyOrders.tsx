import { useEffect, useState } from 'react'
import {
  fetchOrderHistory,
  type SavedOrder,
} from '../data/orderHistoryStorage'

type MyOrdersProps = {
  userId: string
}

export default function MyOrders({ userId }: MyOrdersProps) {
  const [orders, setOrders] = useState<SavedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false

    setOrders([])
    setLoading(true)
    setError('')

    async function load() {
      try {
        const history = await fetchOrderHistory(userId)

        if (!cancelled) setOrders(history)
      } catch (cause) {
        if (!cancelled) {
          const details =
            cause &&
            typeof cause === 'object' &&
            'message' in cause &&
            typeof cause.message === 'string'
              ? cause.message
              : 'Please try again.'

          setError(`Could not load your orders. ${details}`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId, reload])

  return (
    <section>
      <h3>My orders</h3>

      <button
        className="secondary-button"
        disabled={loading}
        onClick={() => setReload(value => value + 1)}
      >
        {loading ? 'Loading...' : 'Refresh orders'}
      </button>

      {loading ? (
        <p role="status">Loading your orders...</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        orders.map(order => (
          <article className="studio-panel" key={order.id}>
            <h4>Test order</h4>

            <p>Order ID: {order.id}</p>
            <p>
              Placed:{' '}
              {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
            <p>No payment taken. This test order will not be shipped.</p>

            {order.items.map(item => (
              <div
                className="bag-item"
                key={`${item.productId}-${item.size}`}
              >
                <img src={item.image} alt={item.name} />

                <div>
                  <strong>{item.name}</strong>
                  <p>
                    Size: {item.size} · Quantity: {item.quantity}
                  </p>
                  <p>
                    ₹{item.price.toLocaleString('en-IN')} each
                  </p>
                  <p>
                    Subtotal: ₹
                    {(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}

            <p className="product-price">
              Items subtotal: ₹{order.subtotal.toLocaleString('en-IN')}
            </p>

            <h4>Delivery address saved with this order</h4>
            <p>{order.deliveryAddress.fullName}</p>
            <p>{order.deliveryAddress.addressLine}</p>
            <p>
              {order.deliveryAddress.city},{' '}
              {order.deliveryAddress.state} —{' '}
              {order.deliveryAddress.postalCode}
            </p>
            <p>{order.deliveryAddress.country}</p>
          </article>
        ))
      )}
    </section>
  )
}