import type { Page } from './Header'

type FooterProps = {
  onNavigate: (page: Page, options?: { category?: string }) => void
}

export default function Footer({ onNavigate }: FooterProps) {
  function handleNavigate(page: Page, options?: { category?: string }) {
    onNavigate(page, options)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="facion-footer" role="contentinfo">
      {/* Dark overlay scrim for photographic readability */}
      <div className="facion-footer-overlay" aria-hidden="true" />

      {/* Main 3-column composition matching reference */}
      <div className="facion-footer-container">
        {/* Left Column: Brand Statement */}
        <div className="facion-footer-brand-statement">
          <span>CLOTHING</span>
          <span>PEOPLE</span>
          <span>PLACES</span>
          <span>A BRIGHTER YOU.</span>
        </div>

        {/* Center Column: FACION Wordmark, Tagline, Burgundy Shop Now Button */}
        <div className="facion-footer-center">
          <h2 className="facion-footer-logo">FACION</h2>
          <p className="facion-footer-tagline">STYLE LIVES HERE.</p>
          <button
            type="button"
            className="facion-footer-shop-btn"
            onClick={() => handleNavigate('Shop')}
            aria-label="Shop Now"
          >
            Shop Now <span>→</span>
          </button>
        </div>

        {/* Right Column: Navigation Links & Social Icons */}
        <div className="facion-footer-right">
          <nav className="facion-footer-nav" aria-label="Footer Navigation">
            <button type="button" onClick={() => handleNavigate('Shop')}>
              SHOP
            </button>
            <button type="button" onClick={() => handleNavigate('Collections')}>
              ABOUT
            </button>
            <button type="button" onClick={() => handleNavigate('Account')}>
              HELP
            </button>
            <button type="button" onClick={() => handleNavigate('Categories')}>
              CONTACT
            </button>
          </nav>

          {/* Social Icons matching bottom-right of reference */}
          <div className="facion-footer-socials" aria-label="Social media">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              onClick={e => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              onClick={e => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.41a6.33 6.33 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.86-4.49V8.84a8.2 8.2 0 0 0 4.77 1.52V6.91a4.84 4.84 0 0 1-1-.22z" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              onClick={e => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor" />
              </svg>
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest"
              onClick={e => e.preventDefault()}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Discreet Legal Line */}
      <div className="facion-footer-legal">
        <p style={{ margin: 0 }}>
          © {new Date().getFullYear()} FACION Inc. Fashion for Every You. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
