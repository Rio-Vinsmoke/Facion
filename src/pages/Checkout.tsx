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

  // Order Confirmed Screen
  if (orderId) {
    return (
      <div className="facion-container" style={{ padding: '60px 24px 100px' }}>
        <div
          style={{
            maxWidth: '560px',
            margin: '0 auto',
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#ebfbee',
              color: '#2b8a3e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 20px',
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-burgundy)', fontWeight: 700 }}>
            Order Confirmed
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, margin: '8px 0 12px', color: 'var(--color-charcoal)' }}>
            Thank You for Your Order
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
            Your test order has been securely recorded. Order reference:
          </p>
          <div
            style={{
              padding: '12px 18px',
              background: 'var(--color-ivory)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'monospace',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-charcoal)',
              letterSpacing: '0.05em',
              marginBottom: '24px',
            }}
          >
            {orderId}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 28px', lineHeight: '1.5' }}>
            Note: This is an atelier demonstration store. No real payment was charged and items will not be physically shipped. Inventory stock has been deducted.
          </p>
          <button type="button" className="primary-button" onClick={onBackToBag}>
            Continue Shopping <span>→</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="facion-container" style={{ padding: '40px 24px 80px' }}>
      <button
        type="button"
        className="secondary-button"
        onClick={onBackToBag}
        disabled={busy}
        style={{ marginBottom: '24px' }}
      >
        ← Back to Bag
      </button>

      <div style={{ marginBottom: '32px' }}>
        <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-muted)', display: 'block', marginBottom: '6px' }}>
          Final Step
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 700, margin: '0 0 6px', color: 'var(--color-charcoal)' }}>
          Checkout
        </h1>
        <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '14px' }}>
          Please confirm your delivery address and review your order.
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--color-white)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
          <p style={{ color: 'var(--color-muted)' }}>Your bag is empty. Please add items before checking out.</p>
          <button type="button" className="primary-button" onClick={onBackToBag}>
            Return to Store
          </button>
        </div>
      ) : !userId ? (
        /* Guest Authentication Gate */
        <div
          style={{
            maxWidth: '560px',
            margin: '20px auto 40px',
            background: 'var(--color-sand)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, margin: '0 0 10px', color: 'var(--color-charcoal)' }}>
            Sign In to Complete Your Order
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 28px' }}>
            You are currently shopping as a guest. To save your delivery address and confirm your order, please sign in or create your FACION account. Your bag will be preserved.
          </p>
          <button
            type="button"
            className="primary-button"
            style={{ width: '100%', padding: '14px', fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
            onClick={onSignIn}
          >
            Sign In / Register to Continue <span>→</span>
          </button>
        </div>
      ) : loading ? (
        <p role="status">Loading your saved delivery address...</p>
      ) : loadError ? (
        <div style={{ padding: '24px', background: 'var(--color-sand)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p role="alert" style={{ color: '#c92a2a' }}>Could not load your delivery address. {loadError}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setReload(value => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Left Column: Address Form */}
          <section
            style={{
              background: 'var(--color-sand)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: '0 0 20px', color: 'var(--color-charcoal)' }}>
              Delivery Address (India)
            </h2>

            <form
              onSubmit={event => {
                event.preventDefault()
                void saveAddress()
              }}
            >
              <fieldset
                disabled={busy}
                style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '16px' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    required
                    autoComplete="shipping name"
                    maxLength={120}
                    value={address.fullName}
                    onChange={event => updateAddress('fullName', event.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', font: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    Mobile Number
                  </label>
                  <input
                    required
                    type="tel"
                    autoComplete="shipping tel-national"
                    inputMode="numeric"
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={address.phone}
                    onChange={event => updateAddress('phone', event.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', font: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    House, Street & Area
                  </label>
                  <textarea
                    required
                    autoComplete="shipping street-address"
                    maxLength={300}
                    rows={3}
                    value={address.addressLine}
                    onChange={event => updateAddress('addressLine', event.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', font: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      City
                    </label>
                    <input
                      required
                      autoComplete="shipping address-level2"
                      maxLength={100}
                      value={address.city}
                      onChange={event => updateAddress('city', event.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', font: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                      State / UT
                    </label>
                    <input
                      required
                      autoComplete="shipping address-level1"
                      maxLength={100}
                      value={address.state}
                      onChange={event => updateAddress('state', event.target.value)}
                      style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', font: 'inherit', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    PIN Code
                  </label>
                  <input
                    required
                    autoComplete="shipping postal-code"
                    inputMode="numeric"
                    pattern="[1-9][0-9]{5}"
                    maxLength={6}
                    value={address.postalCode}
                    onChange={event => updateAddress('postalCode', event.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', font: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <p style={{ margin: '4px 0 10px', fontSize: '13px', color: 'var(--color-muted)' }}>
                  Delivery Destination: <strong>India</strong>
                </p>

                <button
                  type="submit"
                  className="secondary-button"
                  style={{ justifySelf: 'start' }}
                >
                  {busy && !ordering ? 'Saving...' : 'Save delivery address'}
                </button>
              </fieldset>
            </form>

            {message && (
              <p style={{ color: '#2b8a3e', marginTop: '14px', fontSize: '13px', fontWeight: 500 }} role="status">
                ✓ {message}
              </p>
            )}
            {error && (
              <p style={{ color: '#c92a2a', marginTop: '14px', fontSize: '13px' }} role="alert">
                ⚠ {error}
              </p>
            )}
          </section>

          {/* Right Column: Order Review */}
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
              Bag Summary
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px', marginBottom: '20px' }}>
              {items.map(item => (
                <div key={`${item.product.id}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', gap: '10px' }}>
                  <span style={{ color: 'var(--color-charcoal)' }}>
                    {item.product.name} ({item.size} × {item.quantity})
                  </span>
                  <strong style={{ color: 'var(--color-charcoal)' }}>
                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-burgundy)' }}>
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            {!addressSaved && (
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', margin: '0 0 16px' }}>
                Please save your delivery address on the left before placing the test order.
              </p>
            )}

            <button
              type="button"
              className="primary-button"
              style={{ width: '100%', padding: '14px', fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              disabled={busy || !addressSaved || hasStockIssue}
              onClick={() => void submitOrder()}
            >
              {ordering ? 'Placing test order...' : 'Place Test Order'}
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}