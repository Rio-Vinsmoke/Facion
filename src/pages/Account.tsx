import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import MyOrders from './MyOrders'
import CatalogueUpload from './CatalogueUpload'

export default function Account() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
        setLoading(false)
        setPassword('')
      },
    )

    return () => data.subscription.unsubscribe()
  }, [])

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

        setMessage(
          data.session
            ? 'You are signed in.'
            : 'Check your email for a confirmation link, then log in.',
        )
      } else {
        const { error } =
          await supabase.auth.signInWithPassword(credentials)

        if (error) throw error

        setMessage('You are signed in.')
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
    return <p role="status">Loading your account...</p>
  }

  return (
    <>
      <section className="account-panel">
        <h2>My Account</h2>

        {message && <p role="status">{message}</p>}

        {session ? (
          <>
            <p>Signed in as {session.user.email}</p>

            <button
              className="secondary-button"
              onClick={() => void logout()}
              disabled={busy}
            >
              {busy ? 'Logging out...' : 'Log out'}
            </button>
          </>
        ) : (
          <>
            <h3>{mode === 'login' ? 'Log in' : 'Create an account'}</h3>

            <form
              className="account-form"
              onSubmit={event => {
                event.preventDefault()
                void submit()
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={busy}
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
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={busy}
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
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setPassword('')
                setMessage('')
              }}
            >
              {mode === 'login'
                ? 'New here? Create an account'
                : 'Already registered? Log in'}
            </button>
          </>
        )}
      </section>

      {session && (
        <>
          <CatalogueUpload
            key={`upload-${session.user.id}`}
            userId={session.user.id}
          />

          <MyOrders
            key={`orders-${session.user.id}`}
            userId={session.user.id}
          />
        </>
      )}
    </>
  )
}