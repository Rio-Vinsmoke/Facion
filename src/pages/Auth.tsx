import { useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import './Auth.css'

export type AuthMode = 'login' | 'signup' | 'forgot' | 'reset'

interface AuthProps {
  onAuthSuccess?: (session: Session) => void
  initialMode?: AuthMode
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="auth-confirmation-icon"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default function Auth({ onAuthSuccess, initialMode = 'login' }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [confirmationPendingEmail, setConfirmationPendingEmail] = useState<string | null>(null)

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode)
    setErrorMessage('')
    setSuccessMessage('')
    setPassword('')
    setConfirmPassword('')
    setConfirmationPendingEmail(null)
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    if (busy) return

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.')
      return
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setBusy(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          throw new Error('Incorrect email or password. Please verify your details.')
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please confirm your email address before logging in.')
        }
        throw error
      }

      if (data.session) {
        setPassword('')
        if (onAuthSuccess) {
          onAuthSuccess(data.session)
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication failed. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault()
    if (busy) return

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMessage('Please enter an email address.')
      return
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter a password.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter them.')
      return
    }

    setBusy(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      })

      if (error) {
        if (error.message.toLowerCase().includes('user already registered')) {
          throw new Error('An account with this email address already exists. Please sign in.')
        }
        throw error
      }

      // Check if user already exists (Supabase sometimes returns an empty identities list)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error('An account with this email address already exists. Please sign in.')
      }

      setPassword('')
      setConfirmPassword('')

      if (data.session) {
        // Immediate login
        if (onAuthSuccess) {
          onAuthSuccess(data.session)
        }
      } else {
        // Email confirmation is required by Supabase Auth configuration
        setConfirmationPendingEmail(cleanEmail)
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Registration failed. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault()
    if (busy) return

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.')
      return
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setBusy(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      })

      if (error) throw error

      setSuccessMessage(
        `If an account exists for ${cleanEmail}, a password recovery email has been sent. Please check your inbox and spam folder.`,
      )
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not send recovery email. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (busy) return

    if (!password) {
      setErrorMessage('Please enter your new password.')
      return
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter them.')
      return
    }

    setBusy(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      setSuccessMessage('Your password has been successfully updated. You may now continue.')
      setPassword('')
      setConfirmPassword('')

      if (data.user) {
        // Check current session
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session && onAuthSuccess) {
          onAuthSuccess(sessionData.session)
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update password. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" role="region" aria-label="Customer Authentication">
        <header className="auth-header">
          <h1 className="auth-brand">FACION</h1>
          <p className="auth-tagline">Fashion for Every You</p>
        </header>

        {/* Tab switch for Login / Sign Up */}
        {(mode === 'login' || mode === 'signup') && !confirmationPendingEmail && (
          <nav className="auth-tab-group" aria-label="Authentication Options">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
              disabled={busy}
              aria-pressed={mode === 'login'}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
              disabled={busy}
              aria-pressed={mode === 'signup'}
            >
              Create Account
            </button>
          </nav>
        )}

        {errorMessage && (
          <div className="auth-alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-success" role="status">
            {successMessage}
          </div>
        )}

        {/* Confirmation Pending State (when email verification is required) */}
        {confirmationPendingEmail && (
          <div className="auth-confirmation-box">
            <CheckCircleIcon />
            <h2 className="auth-form-title">Check Your Email</h2>
            <p className="auth-form-subtitle">
              We have sent a verification link to <strong>{confirmationPendingEmail}</strong>.
              Please confirm your email address to complete your registration, then sign in.
            </p>
            <button
              type="button"
              className="auth-submit-btn"
              onClick={() => switchMode('login')}
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* Mode: Login */}
        {mode === 'login' && !confirmationPendingEmail && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            <h2 className="auth-form-title">Welcome Back</h2>
            <p className="auth-form-subtitle">
              Sign in to browse the collection and access your studio
            </p>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  disabled={busy}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <button
                type="button"
                className="auth-forgot-link"
                onClick={() => switchMode('forgot')}
                disabled={busy}
              >
                Forgot your password?
              </button>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              {busy ? 'Signing In...' : 'Sign In'}
            </button>

            <footer className="auth-footer">
              <span>New to FACION? </span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => switchMode('signup')}
                disabled={busy}
              >
                Create an account
              </button>
            </footer>
          </form>
        )}

        {/* Mode: Sign Up */}
        {mode === 'signup' && !confirmationPendingEmail && (
          <form className="auth-form" onSubmit={handleSignUp} noValidate>
            <h2 className="auth-form-title">Create Account</h2>
            <p className="auth-form-subtitle">
              Join FACION to curate looks, manage boards, and shop
            </p>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-email">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  disabled={busy}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">
                Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <span className="auth-helper-text">Minimum 8 characters</span>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              {busy ? 'Creating Account...' : 'Create Account'}
            </button>

            <footer className="auth-footer">
              <span>Already have an account? </span>
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => switchMode('login')}
                disabled={busy}
              >
                Sign in
              </button>
            </footer>
          </form>
        )}

        {/* Mode: Forgot Password */}
        {mode === 'forgot' && (
          <form className="auth-form" onSubmit={handleForgotPassword} noValidate>
            <h2 className="auth-form-title">Reset Password</h2>
            <p className="auth-form-subtitle">
              Enter your email address and we will send you a recovery link
            </p>

            <div className="auth-field">
              <label className="auth-label" htmlFor="forgot-email">
                Email Address
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="forgot-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  disabled={busy}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              {busy ? 'Sending Link...' : 'Send Recovery Link'}
            </button>

            <footer className="auth-footer">
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => switchMode('login')}
                disabled={busy}
              >
                Back to Sign In
              </button>
            </footer>
          </form>
        )}

        {/* Mode: Reset Password (after clicking recovery link) */}
        {mode === 'reset' && (
          <form className="auth-form" onSubmit={handleResetPassword} noValidate>
            <h2 className="auth-form-title">Create New Password</h2>
            <p className="auth-form-subtitle">
              Enter and confirm your new password below
            </p>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-password">
                New Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <span className="auth-helper-text">Minimum 8 characters</span>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-confirm-password">
                Confirm New Password
              </label>
              <div className="auth-input-wrapper">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={busy}>
              {busy ? 'Updating Password...' : 'Update Password'}
            </button>

            <footer className="auth-footer">
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => switchMode('login')}
                disabled={busy}
              >
                Back to Sign In
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
