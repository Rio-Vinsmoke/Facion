import { useState } from 'react'
import type { Product } from '../types/product'
import type { Page } from '../components/Header'

type CategoriesProps = {
  catalogue: Product[]
  onNavigate: (page: Page, options?: { category?: string; gender?: string }) => void
}

type CategoryItem = {
  id: string
  name: string
  label: string
  categoryKey: string
  image: string
  description: string
}

const CATEGORY_DIRECTORY: CategoryItem[] = [
  {
    id: 'cat-tops',
    name: 'Tops & Tees',
    label: 'Tops',
    categoryKey: 'Tops',
    image: '/images/campaign/graphic-tee-campaign.png',
    description: 'Effortless graphic tees, knit vests, and everyday casual tops.',
  },
  {
    id: 'cat-jeans',
    name: 'Denim & Jeans',
    label: 'Jeans',
    categoryKey: 'Jeans',
    image: '/images/campaign/featured-collection-man.png',
    description: 'Wide-leg silhouettes, relaxed cuts, and classic washes.',
  },
  {
    id: 'cat-dresses',
    name: 'Dresses',
    label: 'Dresses',
    categoryKey: 'Dresses',
    image: '/images/campaign/collection-poolside.png',
    description: 'Sun-drenched daywear, fluid draping, and evening silhouettes.',
  },
  {
    id: 'cat-hoodies',
    name: 'Hoodies & Outerwear',
    label: 'Hoodies',
    categoryKey: 'Hoodies',
    image: '/images/campaign/burgundy-jacket-campaign.png',
    description: 'Heavyweight loopback fleece, zip jackets, and tailored layers.',
  },
  {
    id: 'cat-shirts',
    name: 'Shirts & Tailoring',
    label: 'Shirts',
    categoryKey: 'Shirts',
    image: '/images/campaign/editorial-burgundy-portrait.png',
    description: 'Boxy poplin shirts, relaxed linens, and refined button-downs.',
  },
  {
    id: 'cat-all',
    name: 'Curated All-In-One',
    label: 'All Items',
    categoryKey: 'All',
    image: '/images/campaign/outfit-builder-campaign.png',
    description: 'Browse the complete atelier catalogue across every fit.',
  },
]

export default function Categories({ catalogue, onNavigate }: CategoriesProps) {
  const [selectedGender, setSelectedGender] = useState<string>('All')

  // Calculate live count per category
  function getCount(key: string): number {
    if (!catalogue) return 0
    if (key === 'All') {
      return selectedGender === 'All'
        ? catalogue.length
        : catalogue.filter(p => (p.gender ?? 'Unisex') === selectedGender).length
    }
    return catalogue.filter(p => {
      const matchCat = p.category === key
      const matchGender = selectedGender === 'All' || (p.gender ?? 'Unisex') === selectedGender
      return matchCat && matchGender
    }).length
  }

  function handleCategoryClick(categoryKey: string) {
    onNavigate('Shop', {
      category: categoryKey === 'All' ? undefined : categoryKey,
      gender: selectedGender === 'All' ? undefined : selectedGender,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="facion-categories-page">
      {/* Editorial Category Header Banner */}
      <section
        style={{
          position: 'relative',
          padding: '70px 24px',
          background: 'radial-gradient(circle at center, rgba(77, 18, 34, 0.4) 0%, rgba(20, 14, 18, 0.85) 100%), url("/images/campaign/collections-group.png") center 30% / cover no-repeat',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '48px',
        }}
      >
        <div className="facion-container">
          <span style={{ fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#DCD4DA', display: 'block', marginBottom: '8px' }}>
            Catalogue Directory
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5.5vw, 64px)', fontWeight: 800, letterSpacing: '0.12em', margin: '0 0 14px', textTransform: 'uppercase' }}>
            Categories
          </h1>
          <p style={{ maxWidth: '480px', margin: '0 auto 28px', color: '#E4DDE2', fontSize: '14px', lineHeight: '1.6' }}>
            Discover thoughtful tailoring, comfortable streetwear, and timeless essentials grouped by fit and silhouette.
          </p>

          {/* Gender / Collection Filter Pills */}
          <div style={{ display: 'inline-flex', gap: '8px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', padding: '6px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
            {['All', 'Women', 'Men', 'Unisex'].map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGender(g)}
                style={{
                  background: selectedGender === g ? '#ffffff' : 'transparent',
                  color: selectedGender === g ? 'var(--color-charcoal)' : '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {g === 'All' ? 'All Collections' : g}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Directory Cards */}
      <section className="facion-container" style={{ marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {CATEGORY_DIRECTORY.map(cat => {
            const count = getCount(cat.categoryKey)
            return (
              <article
                key={cat.id}
                onClick={() => handleCategoryClick(cat.categoryKey)}
                style={{
                  background: 'var(--color-sand)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  e.currentTarget.style.borderColor = 'var(--color-burgundy)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                }}
              >
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 10', overflow: 'hidden', background: '#F3EFEA' }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(6px)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '11px', fontWeight: 700, color: 'var(--color-burgundy)' }}>
                    {count} Piece{count !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--color-charcoal)' }}>
                      {cat.name}
                    </h2>
                    <span style={{ fontSize: '18px', color: 'var(--color-burgundy)', fontWeight: 700 }}>
                      →
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-muted)', lineHeight: '1.5', flex: 1 }}>
                    {cat.description}
                  </p>
                  <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: 'var(--color-burgundy)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <span>Browse Collection</span>
                    <span>Explore →</span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
