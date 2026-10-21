import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'

export type Page =
  | 'Home'
  | 'Shop'
  | 'Categories'
  | 'Collections'
  | 'Outfit Builder'
  | 'Outfit Studio'
  | 'My Looks'
  | 'My Boards'
  | 'Wishlist'
  | 'Bag'
  | 'Account'
  | 'Checkout'
  | 'Auth'

type HeaderProps = {
  activePage: Page
  onNavigate: (page: Page) => void
  wishlistCount: number
  bagCount: number
  session: Session | null
}

export default function Header({
  activePage,
  onNavigate,
  wishlistCount,
  bagCount,
  session,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function navigateTo(page: Page) {
    onNavigate(page)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header
        className={`facion-header ${activePage === 'Home' ? 'facion-header-home' : ''}`}
        role="banner"
      >
        <div className="facion-container facion-header-inner">
          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="facion-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Desktop Left Navigation */}
          <nav className="facion-nav-desktop" aria-label="Main menu">
            <button
              type="button"
              className={`facion-nav-link ${activePage === 'Home' ? 'active' : ''}`}
              onClick={() => navigateTo('Home')}
            >
              Home
            </button>
            <button
              type="button"
              className={`facion-nav-link ${activePage === 'Shop' ? 'active' : ''}`}
              onClick={() => navigateTo('Shop')}
            >
              Shop
            </button>
            <button
              type="button"
              className={`facion-nav-link ${activePage === 'Categories' ? 'active' : ''}`}
              onClick={() => navigateTo('Categories')}
            >
              Categories
            </button>
            <button
              type="button"
              className={`facion-nav-link ${activePage === 'Outfit Builder' || activePage === 'Outfit Studio' ? 'active' : ''}`}
              onClick={() => navigateTo('Outfit Builder')}
            >
              Outfit Builder
            </button>
            <button
              type="button"
              className={`facion-nav-link ${activePage === 'Collections' ? 'active' : ''}`}
              onClick={() => navigateTo('Collections')}
            >
              Collections
            </button>
          </nav>

          {/* Center Brand Logo (returns to Home) */}
          <button
            type="button"
            className="facion-brand-logo"
            onClick={() => navigateTo('Home')}
            aria-label="FACION Home"
          >
            FACION
          </button>

          {/* Right Header Action Icons */}
          <div className="facion-header-actions" aria-label="Shopping utilities">
            {/* Search Icon */}
            <button
              type="button"
              className="facion-icon-btn"
              onClick={() => navigateTo('Shop')}
              aria-label="Search products"
              title="Search catalogue"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Wishlist Icon */}
            <button
              type="button"
              className="facion-icon-btn"
              onClick={() => navigateTo('Wishlist')}
              aria-label={`Wishlist, ${wishlistCount} items`}
              title="View wishlist"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="facion-badge" aria-hidden="true">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Profile / Account Icon */}
            <button
              type="button"
              className="facion-icon-btn"
              onClick={() => navigateTo('Account')}
              aria-label={session ? 'My Account' : 'Sign in to account'}
              title={session ? 'My Account' : 'Sign in'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {/* Bag Icon */}
            <button
              type="button"
              className="facion-icon-btn"
              onClick={() => navigateTo('Bag')}
              aria-label={`Shopping bag, ${bagCount} items`}
              title="View shopping bag"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {bagCount > 0 && (
                <span className="facion-badge" aria-hidden="true">
                  {bagCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop & Drawer */}
      <div
        className={`facion-mobile-overlay ${mobileMenuOpen ? 'is-open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={`facion-mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}
        aria-label="Mobile navigation"
      >
        <div className="facion-drawer-header">
          <button
            type="button"
            className="facion-brand-logo"
            onClick={() => navigateTo('Home')}
          >
            FACION
          </button>
          <button
            type="button"
            className="facion-icon-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="facion-drawer-links">
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'Home' ? 'active' : ''}`}
            onClick={() => navigateTo('Home')}
          >
            Home <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'Shop' ? 'active' : ''}`}
            onClick={() => navigateTo('Shop')}
          >
            Shop Catalogue <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'Categories' ? 'active' : ''}`}
            onClick={() => navigateTo('Categories')}
          >
            Categories <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'Collections' ? 'active' : ''}`}
            onClick={() => navigateTo('Collections')}
          >
            Collections <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'Outfit Builder' ? 'active' : ''}`}
            onClick={() => navigateTo('Outfit Builder')}
          >
            Outfit Builder <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'Outfit Studio' ? 'active' : ''}`}
            onClick={() => navigateTo('Outfit Studio')}
          >
            Studio Canvas <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'My Looks' ? 'active' : ''}`}
            onClick={() => navigateTo('My Looks')}
          >
            My Looks <span>→</span>
          </button>
          <button
            type="button"
            className={`facion-drawer-link ${activePage === 'My Boards' ? 'active' : ''}`}
            onClick={() => navigateTo('My Boards')}
          >
            My Boards <span>→</span>
          </button>
        </nav>

        <div className="facion-drawer-footer">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigateTo('Account')}
          >
            {session ? 'My Account' : 'Sign In / Register'}
          </button>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center' }}>
            Fashion for Every You
          </p>
        </div>
      </aside>
    </>
  )
}
