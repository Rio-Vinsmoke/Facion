import type { Page } from '../components/Header'

type OutfitPromoProps = {
  onNavigate: (page: Page) => void
}

export default function OutfitPromo({ onNavigate }: OutfitPromoProps) {
  function handleStartBuilding() {
    onNavigate('Outfit Studio')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="facion-outfit-promo-page">
      {/* Burgundy Hero Banner */}
      <section
        style={{
          background: 'var(--color-burgundy)',
          color: '#ffffff',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="facion-container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 1fr',
              gap: '48px',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.24em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '12px',
                }}
              >
                Virtual Atelier Studio
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(44px, 7vw, 76px)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  margin: '0 0 20px',
                }}
              >
                <em>Outfit</em> Builder
              </h1>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#E4CCD2',
                  margin: '0 0 32px',
                  maxWidth: '480px',
                }}
              >
                Mix, match, and curate your wardrobe in real time. Drag garments onto our interactive styling canvas, test proportions, and save ready-to-wear looks directly to your moodboards.
              </p>
              <button
                type="button"
                className="glass-glow-btn light"
                onClick={handleStartBuilding}
              >
                Create Outfit Now <span>→</span>
              </button>
            </div>

            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#ffffff',
                  padding: '14px 14px 40px',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
                  transform: 'rotate(-2deg)',
                  borderRadius: '3px',
                }}
              >
                <img
                  src="/images/campaign/burgundy-jacket-campaign.png"
                  alt="Burgundy Jacket Styling"
                  style={{ width: '320px', maxHeight: '440px', objectFit: 'cover' }}
                  loading="lazy"
                  decoding="async"
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '18px',
                    fontFamily: 'var(--font-handwriting)',
                    fontSize: '24px',
                    color: 'var(--color-charcoal)',
                  }}
                >
                  no rules. just style.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Walkthrough Grid */}
      <section className="facion-container" style={{ padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 60px' }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-muted)' }}>
            How It Works
          </span>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', fontWeight: 700, color: 'var(--color-charcoal)', margin: '8px 0 16px' }}>
            Styling Made Intuitive
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            Bring your dream wardrobe to life before buying. No 3D gimmicks—just a clean, tactile 2D canvas of our actual clothing line.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {/* Step 1 */}
          <div style={{ background: 'var(--color-sand)', padding: '32px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)', marginBottom: '12px', fontWeight: 800 }}>
              01
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 10px', color: 'var(--color-charcoal)' }}>
              Select From Atelier
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.6', margin: 0 }}>
              Browse real pieces from Tops, Denim, Outerwear, and Dresses. Click any garment to place its transparent cutout onto your canvas.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ background: 'var(--color-sand)', padding: '32px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)', marginBottom: '12px', fontWeight: 800 }}>
              02
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 10px', color: 'var(--color-charcoal)' }}>
              Drag, Rotate & Scale
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.6', margin: 0 }}>
              Arrange layers naturally with touch and pointer gestures. Rotate outerwear over tees and tuck shirts beneath jeans effortlessly.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ background: 'var(--color-sand)', padding: '32px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--color-burgundy)', marginBottom: '12px', fontWeight: 800 }}>
              03
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 10px', color: 'var(--color-charcoal)' }}>
              Save To Moodboards
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.6', margin: 0 }}>
              Organize saved looks into custom boards like "Weekend Trip" or "Autumn Date Night" to plan your upcoming outfits and purchases.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Banner with 2nd Image */}
      <section className="facion-container" style={{ marginBottom: '80px' }}>
        <div
          style={{
            background: 'var(--color-sand)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            alignItems: 'center',
          }}
        >
          <div style={{ padding: '48px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-burgundy)', fontWeight: 700 }}>
              Personal Lookbooks
            </span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, margin: '10px 0 16px', color: 'var(--color-charcoal)' }}>
              Your Style, Your Rules
            </h2>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--color-muted)', margin: '0 0 28px' }}>
              Whether you are shopping as a guest or saving looks to your account, Outfit Studio remembers your styling creations in your browser.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleStartBuilding}
              >
                Launch Outfit Studio ✦
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => onNavigate('My Looks')}
              >
                View Saved Looks
              </button>
            </div>
          </div>

          <div style={{ height: '100%', minHeight: '380px', overflow: 'hidden' }}>
            <img
              src="/images/campaign/outfit-builder-campaign.png"
              alt="Outfit Builder Editorial"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
