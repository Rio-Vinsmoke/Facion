import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import MyOrders from './MyOrders'

type AccountProps = {
  session?: Session | null
  onAuthSuccess?: (session: Session) => void
  returnToCheckout?: boolean
}

export default function Account({
  session: propSession,
  onAuthSuccess,
  returnToCheckout,
}: AccountProps) {
  const [internalSession, setInternalSession] = useState<Session | null>(
    propSession ?? null,
  )
  const [loading, setLoading] = useState(propSession === undefined)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const session = propSession !== undefined ? propSession : internalSession

  useEffect(() => {
    if (propSession !== undefined) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setInternalSession(data.session)
      setLoading(false)
    })
  }, [propSession])

  async function submit() {
    if (busy) return

    setBusy(true)
    setMessage('')

    try {
      const credentials = {
        email: email.trim(),
        password,
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp(credentials)

        if (error) throw error

        if (data.session) {
          setInternalSession(data.session)
          if (onAuthSuccess) {
            onAuthSuccess(data.session)
          }
        }

        setMessage(
          data.session
            ? 'Account created and signed in.'
            : 'Check your email for a confirmation link, then log in.',
        )
      } else {
        const { data, error } =
          await supabase.auth.signInWithPassword(credentials)

        if (error) throw error

        if (data.session) {
          setInternalSession(data.session)
          if (onAuthSuccess) {
            onAuthSuccess(data.session)
          }
        }

        setMessage('Signed in successfully.')
      }

      setPassword('')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    if (busy) return

    setBusy(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      setInternalSession(null)
      setMessage('You are logged out.')
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Could not log out.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="facion-container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p role="status">Loading your account...</p>
      </div>
    )
  }

  return (
    <div className="facion-container" style={{ padding: '40px 24px 80px' }}>
      <section className="account-panel">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, margin: '0 0 12px', color: 'var(--color-charcoal)' }}>
          My Account
        </h1>

        {returnToCheckout && !session && (
          <div style={{ padding: '10px 14px', background: 'var(--color-burgundy-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--color-burgundy)', fontSize: '13px', marginBottom: '16px' }}>
            Sign in to continue to checkout. Your bag has been saved.
          </div>
        )}

        {message && (
          <p role="status" style={{ fontSize: '13px', color: message.includes('error') || message.includes('Could not') ? '#c92a2a' : '#2b8a3e', margin: '0 0 16px' }}>
            {message}
          </p>
        )}

        {session ? (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--color-charcoal)', marginBottom: '18px' }}>
              Signed in as <strong>{session.user.email}</strong>
            </p>

            <button
              className="secondary-button"
              onClick={() => void logout()}
              disabled={busy}
            >
              {busy ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px', color: 'var(--color-charcoal)' }}>
              {mode === 'login' ? 'Log in to your account' : 'Create a new account'}
            </h2>

            <form
              className="account-form"
              onSubmit={event => {
                event.preventDefault()
                void submit()
              }}
            >
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={busy}
                  style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                  minLength={mode === 'signup' ? 8 : undefined}
                  required
                  disabled={busy}
                  style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={busy}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {busy
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Log in'
                    : 'Create account'}
              </button>
            </form>

            <button
              className="secondary-button"
              disabled={busy}
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setPassword('')
                setMessage('')
              }}
            >
              {mode === 'login'
                ? 'New to FACION? Create an account'
                : 'Already registered? Log in'}
            </button>
          </div>
        )}
      </section>

      {session && (
        <section style={{ marginTop: '40px' }}>
          <MyOrders
            key={`orders-${session.user.id}`}
            userId={session.user.id}
          />
        </section>
      )}
    </div>
  )
}