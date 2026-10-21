import type { Page } from '../components/Header'

type CollectionsProps = {
  onNavigate: (page: Page, options?: { category?: string }) => void
}

export default function Collections({ onNavigate }: CollectionsProps) {
  function handleNavigate(page: Page, options?: { category?: string }) {
    onNavigate(page, options)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="facion-collections-page">
      {/* Editorial Lookbook Hero */}
      <section
        style={{
          position: 'relative',
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px 24px',
          background: 'linear-gradient(180deg, rgba(20, 14, 18, 0.2) 0%, rgba(20, 14, 18, 0.8) 100%), url("/images/campaign/collection-poolside.png") center 35% / cover no-repeat',
          color: '#ffffff',
          marginBottom: '64px',
        }}
      >
        <div className="facion-container">
          <span style={{ fontSize: '12px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#E4CBD2', display: 'block', marginBottom: '8px' }}>
            Lookbook Edition · 2026
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(44px, 8vw, 84px)', fontWeight: 800, letterSpacing: '0.08em', margin: '0 0 16px', lineHeight: 1.05 }}>
            Late Summer <em style={{ fontStyle: 'italic', fontWeight: 400 }}>Atelier</em>
          </h1>
          <p style={{ maxWidth: '540px', fontSize: '15px', lineHeight: '1.6', color: '#EBE5EA', margin: '0 0 32px' }}>
            A curated study in warm tones, lightweight tailoring, and effortless poolside leisure. Designed for balmy evenings and timeless everyday presence.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="glass-glow-btn light"
              onClick={() => handleNavigate('Categories')}
            >
              Shop Collections <span>→</span>
            </button>
            <button
              type="button"
              className="glass-glow-btn"
              onClick={() => handleNavigate('Outfit Builder')}
            >
              Create an Outfit <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Lookbook Visual Storyboard Grid */}
      <section className="facion-container" style={{ marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '80px' }}>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img
              src="/images/campaign/collections-group.png"
              alt="The Collective Story"
              style={{ width: '100%', height: '520px', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Chapter 01 · The Collective
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 700, margin: 0, color: 'var(--color-charcoal)' }}>
              Good People, <em style={{ fontStyle: 'italic' }}>Better Days</em>
            </h2>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-muted)', margin: 0 }}>
              Rooted in classic California road-trip aesthetics and updated with contemporary relaxed cuts. The Collective collection bridges casual graphic cottons and structured work jackets made to endure.
            </p>
            <div style={{ paddingTop: '10px' }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleNavigate('Categories')}
              >
                Browse Collective Fits
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', order: 2 }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
              Chapter 02 · Leisure
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 700, margin: 0, color: 'var(--color-warm-brown)' }}>
              Poolside <em style={{ fontStyle: 'italic' }}>State of Mind</em>
            </h2>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-muted)', margin: 0 }}>
              Sun-drenched loungewear, fluid cotton jersey dresses, and oversized crewnecks styled for restorative escapes. Layered comfort with high-fashion ease.
            </p>
            <div style={{ paddingTop: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleNavigate('Outfit Builder')}
              >
                Style This Mood in Studio
              </button>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', order: 1 }}>
            <img
              src="/images/campaign/story-poolside.png"
              alt="Poolside State of Mind look"
              style={{ width: '100%', height: '520px', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Interactive CTA Banner */}
      <section
        style={{
          background: 'var(--color-burgundy)',
          color: '#ffffff',
          padding: '70px 24px',
          textAlign: 'center',
          marginBottom: '40px',
        }}
      >
        <div className="facion-container">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 700, margin: '0 0 14px' }}>
            Ready to Build Your Look?
          </h2>
          <p style={{ maxWidth: '520px', margin: '0 auto 28px', color: '#E4CCD2', fontSize: '15px' }}>
            Mix garments from the Late Summer Collection on our virtual styling board and save your custom outfits.
          </p>
          <button
            type="button"
            className="glass-glow-btn light"
            onClick={() => handleNavigate('Outfit Builder')}
          >
            Create an Outfit <span>→</span>
          </button>
        </div>
      </section>
    </div>
  )
}
