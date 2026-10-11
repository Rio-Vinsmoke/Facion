import { useEffect, useRef, useState } from 'react'
import {
  fetchDeliveryAddress,
  saveDeliveryAddress,
} from '../data/addressStorage'
import { getSizeStock } from '../data/productStorage'
import type { DeliveryAddress } from '../types/address'
import type { CartItem } from '../types/cart'

type CheckoutProps = {
  userId: string | null
  items: CartItem[]
  onBackToBag: () => void
  onSignIn: () => void
  onPlaceOrder: () => Promise<string>
}

const emptyAddress: DeliveryAddress = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Please try again.'
}

export default function Checkout({
  userId,
  items,
  onBackToBag,
  onSignIn,
  onPlaceOrder,
}: CheckoutProps) {
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress)
  const [addressSaved, setAddressSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const [reload, setReload] = useState(0)
  const [orderId, setOrderId] = useState('')
  const working = useRef(false)

  useEffect(() => {
    let cancelled = false

    setAddress(emptyAddress)
    setAddressSaved(false)
    setLoadError('')
    setError('')
    setMessage('')
    setOrderId('')

    if (!userId) {
      setLoading(false)
      return
    }

    const ownerId = userId
    setLoading(true)

    async function load() {
      try {
        const savedAddress = await fetchDeliveryAddress(ownerId)

        if (!cancelled) {
          setAddress(savedAddress ?? emptyAddress)
          setAddressSaved(savedAddress !== null)
        }
      } catch (cause) {
        if (!cancelled) setLoadError(getErrorMessage(cause))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId, reload])

  function updateAddress(field: keyof DeliveryAddress, value: string) {
    setAddress(current => ({ ...current, [field]: value }))
    setAddressSaved(false)
    setMessage('')
    setError('')
  }

  async function saveAddress() {
    if (!userId || loading || loadError || working.current) return

    const cleaned: DeliveryAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      addressLine: address.addressLine.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      postalCode: address.postalCode.trim(),
    }

    if (Object.values(cleaned).some(value => !value)) {
      setError('Please fill in every address field.')
      return
    }

    if (!/^[6-9][0-9]{9}$/.test(cleaned.phone)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!/^[1-9][0-9]{5}$/.test(cleaned.postalCode)) {
      setError('Enter a valid 6-digit PIN code.')
      return
    }

    working.current = true
    setBusy(true)
    setMessage('')
    setError('')

    try {
      await saveDeliveryAddress(userId, cleaned)
      setAddress(cleaned)
      setAddressSaved(true)
      setMessage('Delivery address saved to your account.')
    } catch (cause) {
      setError(`Could not save your address. ${getErrorMessage(cause)}`)
    } finally {
      working.current = false
      setBusy(false)
    }
  }

  async function submitOrder() {
    if (
      !userId ||
      !addressSaved ||
      loading ||
      loadError ||
      working.current ||
      items.length === 0
    ) {
      return
    }

    working.current = true
    setBusy(true)
    setOrdering(true)
    setError('')
    setMessage('')

    try {
      const placedOrderId = await onPlaceOrder()
      setOrderId(placedOrderId)
    } catch (cause) {
      setError(getErrorMessage(cause))
    } finally {
      working.current = false
      setBusy(false)
      setOrdering(false)
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  )

  const hasStockIssue = items.some(
    item => item.quantity > getSizeStock(item.product, item.size),
  )

  if (orderId) {
    return (
      <section>
        <h2>Test order placed</h2>
        <p role="status">Your test order has been saved.</p>
        <p>
          Order ID: <strong>{orderId}</strong>
        </p>
        <p>
          No payment was taken. This is a test order and will not be shipped.
          Test stock has been deducted.
        </p>
        <button className="secondary-button" onClick={onBackToBag}>
          Back to bag
        </button>
      </section>
    )
  }

  return (
    <section>
      <h2>Checkout</h2>

      <button
        className="secondary-button"
        onClick={onBackToBag}
        disabled={busy}
      >
        ← Back to bag
      </button>

      {items.length === 0 ? (
        <p>Your bag is empty. Add a product before checking out.</p>
      ) : !userId ? (
        <>
          <p>Sign in to save your delivery address and place a test order.</p>
          <button className="primary-button" onClick={onSignIn}>
            Go to account
          </button>
        </>
      ) : loading ? (
        <p role="status">Loading your delivery address...</p>
      ) : loadError ? (
        <>
          <p role="alert">
            Could not load your delivery address. {loadError}
          </p>
          <button
            className="secondary-button"
            onClick={() => setReload(value => value + 1)}
          >
            Try again
          </button>
        </>
      ) : (
        <div className="product-view">
          <section className="studio-panel">
            <h3>Delivery address</h3>

            <form
              onSubmit={event => {
                event.preventDefault()
                void saveAddress()
              }}
            >
              <fieldset
                disabled={busy}
                style={{ border: 0, padding: 0, margin: 0 }}
              >
                <label className="studio-control">
                  Full name
                  <input
                    required
                    autoComplete="shipping name"
                    maxLength={120}
                    value={address.fullName}
                    onChange={event =>
                      updateAddress('fullName', event.target.value)
                    }
                  />
                </label>

                <label className="studio-control">
                  Mobile number
                  <input
                    required
                    type="tel"
                    autoComplete="shipping tel-national"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={event =>
                      updateAddress('phone', event.target.value)
                    }
                  />
                </label>

                <label className="studio-control">
                  House, street and area
                  <textarea
                    required
                    autoComplete="shipping street-address"
                    maxLength={300}
                    rows={3}
                    value={address.addressLine}
                    onChange={event =>
                      updateAddress('addressLine', event.target.value)
                    }
                  />
                </label>

                <label className="studio-control">
                  City
                  <input
                    required
                    autoComplete="shipping address-level2"
                    maxLength={100}
                    value={address.city}
                    onChange={event =>
                      updateAddress('city', event.target.value)
                    }
                  />
                </label>

                <label className="studio-control">
                  State / Union territory
                  <input
                    required
                    autoComplete="shipping address-level1"
                    maxLength={100}
                    value={address.state}
                    onChange={event =>
                      updateAddress('state', event.target.value)
                    }
                  />
                </label>

                <label className="studio-control">
                  PIN code
                  <input
                    required
                    autoComplete="shipping postal-code"
                    inputMode="numeric"
                    pattern="[1-9][0-9]{5}"
                    maxLength={6}
                    value={address.postalCode}
                    onChange={event =>
                      updateAddress('postalCode', event.target.value)
                    }
                  />
                </label>

                <p>Country: India</p>

                <button className="primary-button" type="submit">
                  {busy && !ordering ? 'Saving...' : 'Save delivery address'}
                </button>
              </fieldset>
            </form>

            {message && <p role="status">{message}</p>}
          </section>

          <aside className="studio-panel">
            <h3>Bag summary</h3>

            {items.map(item => (
              <div key={`${item.product.id}-${item.size}`}>
                <p>
                  {item.product.name} — {item.size} × {item.quantity}
                </p>
                <p>
                  ₹
                  {(item.product.price * item.quantity).toLocaleString(
                    'en-IN',
                  )}
                </p>
              </div>
            ))}

            <strong>
              Estimated items subtotal: ₹{subtotal.toLocaleString('en-IN')}
            </strong>

            <p>
              Current catalogue prices and stock are checked when placing
              the test order.
            </p>

            {hasStockIssue && (
              <p role="alert">
                Return to your bag to fix unavailable quantities.
              </p>
            )}

            {!addressSaved && (
              <p>Save your delivery address before placing the test order.</p>
            )}

            <p>
              Test only: no payment, delivery charge or shipment.
              Placing this order deducts test stock.
            </p>

            <button
              className="primary-button"
              disabled={busy || !addressSaved || hasStockIssue}
              onClick={() => void submitOrder()}
            >
              {ordering ? 'Placing test order...' : 'Place test order'}
            </button>
          </aside>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  )
}