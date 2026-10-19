import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { fetchProducts } from '../data/productStorage'
import type { Product } from '../types/product'
import type { Look } from '../types/look'
import {
  getProductDisplayImage,
  getGarmentAspectRatio,
  matchesProductSearch,
  SAFE_PRODUCT_IMAGE_FALLBACK,
} from '../lib/productUtils'
import './OutfitStudio.css'

type Props = {
  initialLook: Look | null
  onSave: (look: Look) => Promise<boolean>
}

type Piece = {
  id: string
  product: Product
  x: number
  y: number
  width: number
  rotation: number
}

type Point = {
  x: number
  y: number
}

type Gesture = {
  pointerId: number
  mode: 'move' | 'resize' | 'rotate'
  original: Piece
  start: Point
  anchor: Point
  sx: number
  sy: number
  startAngle: number
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 1000
const MIN_SIZE = 40
const MAX_SIZE = 700

const corners = [
  { name: 'top left', sx: -1, sy: -1 },
  { name: 'top right', sx: 1, sy: -1 },
  { name: 'bottom left', sx: -1, sy: 1 },
  { name: 'bottom right', sx: 1, sy: 1 },
] as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function errorMessage(error: unknown) {
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

export default function OutfitStudio(props: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const catalogue = await fetchProducts()
        if (!cancelled) {
          setProducts(catalogue)
          setError('')
        }
      } catch (cause) {
        if (!cancelled) setError(errorMessage(cause))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [reload])

  if (loading) {
    return <p role="status">Loading your clothing library...</p>
  }

  if (error) {
    return (
      <section>
        <h2>Outfit Studio</h2>
        <p role="alert">Could not load the library. {error}</p>
        <button
          className="secondary-button"
          onClick={() => {
            setLoading(true)
            setError('')
            setReload(value => value + 1)
          }}
        >
          Try again
        </button>
      </section>
    )
  }

  const missingProduct = props.initialLook?.items.some(
    item => !products.some(product => product.id === item.productId),
  )

  if (missingProduct) {
    return (
      <p role="alert">
        A product in this look is missing from the catalogue.
        Restore it before editing this look.
      </p>
    )
  }

  return <Editor {...props} products={products} />
}

function Editor({
  initialLook,
  onSave,
  products,
}: Props & { products: Product[] }) {
  const [lookId] = useState(() => initialLook?.id ?? crypto.randomUUID())
  const [lookName, setLookName] = useState(initialLook?.name ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({})

  const [pieces, setPieces] = useState<Piece[]>(() =>
    (initialLook?.items ?? []).flatMap(item => {
      const product = products.find(entry => entry.id === item.productId)

      return product
        ? [
            {
              id: item.id,
              product,
              x: item.x,
              y: item.y,
              width: item.width,
              rotation: item.rotation,
            },
          ]
        : []
    }),
  )

  const svgRef = useRef<SVGSVGElement | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const saving = useRef(false)

  // Measure and cache aspect ratios for pieces already on the canvas
  useEffect(() => {
    pieces.forEach(piece => {
      if (!aspectRatios[piece.product.id]) {
        const src = getProductDisplayImage(piece.product)
        const img = new Image()
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalHeight / img.naturalWidth
            if (ratio > 0.2 && ratio < 4.0) {
              setAspectRatios(prev => {
                if (prev[piece.product.id] === ratio) return prev
                return { ...prev, [piece.product.id]: ratio }
              })
            }
          }
        }
        img.src = src
      }
    })
  }, [pieces, aspectRatios])

  // Get distinct categories from loaded products
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => {
      if (p.category) set.add(p.category)
    })
    return Array.from(set).sort()
  }, [products])

  // Filter products using category filter and multi-keyword search
  const visibleProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory =
        category === 'All' || product.category === category
      const matchesSearch = matchesProductSearch(product, search)
      return matchesCategory && matchesSearch
    })
  }, [products, category, search])

  const selected = pieces.find(piece => piece.id === selectedId)
  const selectedHeight = selected ? getPieceHeight(selected) : 0

  function getPieceHeight(piece: Piece): number {
    const ratio = getGarmentAspectRatio(
      piece.product,
      aspectRatios[piece.product.id],
    )
    return piece.width * ratio
  }

  function handleImageLoad(
    productId: string,
    naturalWidth: number,
    naturalHeight: number,
  ) {
    if (naturalWidth && naturalHeight) {
      const ratio = naturalHeight / naturalWidth
      if (ratio > 0.2 && ratio < 4.0 && aspectRatios[productId] !== ratio) {
        setAspectRatios(prev => ({ ...prev, [productId]: ratio }))
      }
    }
  }

  function canvasPoint(clientX: number, clientY: number): Point | null {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()

    if (!svg || !matrix) return null

    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY

    const result = point.matrixTransform(matrix.inverse())
    return { x: result.x, y: result.y }
  }

  function addPiece(product: Product) {
    const piece: Piece = {
      id: crypto.randomUUID(),
      product,
      x: 280,
      y: 180,
      width: 200,
      rotation: 0,
    }

    setPieces(current => [...current, piece])
    setSelectedId(piece.id)
    setMessage('')
  }

  function beginGesture(
    event: ReactPointerEvent<SVGElement>,
    piece: Piece,
    mode: Gesture['mode'],
    sx = 1,
    sy = 1,
  ) {
    if (busy || event.button !== 0) return

    const start = canvasPoint(event.clientX, event.clientY)
    const svg = svgRef.current
    if (!start || !svg) return

    event.preventDefault()
    event.stopPropagation()
    svg.setPointerCapture(event.pointerId)

    const angle = (piece.rotation * Math.PI) / 180
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const pieceHeight = getPieceHeight(piece)
    const centerX = piece.x + piece.width / 2
    const centerY = piece.y + pieceHeight / 2

    gesture.current = {
      pointerId: event.pointerId,
      mode,
      original: { ...piece },
      start,
      sx,
      sy,
      anchor: {
        x:
          centerX -
          (cos * sx * piece.width) / 2 +
          (sin * sy * pieceHeight) / 2,
        y:
          centerY -
          (sin * sx * piece.width) / 2 -
          (cos * sy * pieceHeight) / 2,
      },
      startAngle: Math.atan2(start.y - centerY, start.x - centerX),
    }

    setSelectedId(piece.id)
    setMessage('')
  }

  function moveGesture(event: ReactPointerEvent<SVGSVGElement>) {
    const active = gesture.current

    if (
      !active ||
      active.pointerId !== event.pointerId ||
      busy
    ) {
      return
    }

    const point = canvasPoint(event.clientX, event.clientY)
    if (!point) return

    const original = active.original
    const originalHeight = getPieceHeight(original)
    let changes: Partial<Piece>

    if (active.mode === 'move') {
      changes = {
        x: clamp(
          original.x + point.x - active.start.x,
          0,
          CANVAS_WIDTH - original.width,
        ),
        y: clamp(
          original.y + point.y - active.start.y,
          0,
          CANVAS_HEIGHT - originalHeight,
        ),
      }
    } else if (active.mode === 'resize') {
      const angle = (original.rotation * Math.PI) / 180
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const dx = point.x - active.anchor.x
      const dy = point.y - active.anchor.y

      const localX = cos * dx + sin * dy
      const localY = -sin * dx + cos * dy

      const ratio = getGarmentAspectRatio(
        original.product,
        aspectRatios[original.product.id],
      )

      const width = clamp(
        (active.sx * localX + (active.sy * localY) / ratio) / 2,
        MIN_SIZE,
        MAX_SIZE,
      )

      const height = width * ratio

      const centerX =
        active.anchor.x +
        (cos * active.sx * width) / 2 -
        (sin * active.sy * height) / 2

      const centerY =
        active.anchor.y +
        (sin * active.sx * width) / 2 +
        (cos * active.sy * height) / 2

      changes = {
        width,
        x: centerX - width / 2,
        y: centerY - height / 2,
      }
    } else {
      const origHeight = getPieceHeight(original)
      const centerX = original.x + original.width / 2
      const centerY = original.y + origHeight / 2
      const angle = Math.atan2(point.y - centerY, point.x - centerX)

      const degrees =
        original.rotation +
        ((angle - active.startAngle) * 180) / Math.PI

      changes = {
        rotation: ((((degrees + 180) % 360) + 360) % 360) - 180,
      }
    }

    setPieces(current =>
      current.map(piece =>
        piece.id === original.id
          ? { ...piece, ...changes }
          : piece,
      ),
    )
  }

  function endGesture(event: ReactPointerEvent<SVGSVGElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return

    gesture.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function moveLayer(direction: 'front' | 'back') {
    setPieces(current => {
      const piece = current.find(entry => entry.id === selectedId)
      if (!piece) return current

      const others = current.filter(entry => entry.id !== selectedId)

      return direction === 'front'
        ? [...others, piece]
        : [piece, ...others]
    })

    setMessage('')
  }

  async function saveLook() {
    if (
      saving.current ||
      gesture.current ||
      !lookName.trim() ||
      pieces.length === 0
    ) {
      return
    }

    saving.current = true
    setBusy(true)
    setMessage('')

    try {
      const saved = await onSave({
        id: lookId,
        name: lookName.trim(),
        updatedAt: new Date().toISOString(),
        items: pieces.map(piece => ({
          id: piece.id,
          productId: piece.product.id,
          x: piece.x,
          y: piece.y,
          width: piece.width,
          rotation: piece.rotation,
        })),
      })

      setMessage(
        saved
          ? 'Look saved. You can reopen it from My Looks.'
          : 'Could not save. Check the message above and try again.',
      )
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <section className="outfit-editor">
      <h2>Outfit Studio</h2>
      <p>
        Drag a piece to move it. Drag a corner to resize.
        Drag the round handle above it to rotate.
      </p>

      <fieldset className="oe-fieldset" disabled={busy}>
        <div className="oe-layout">
          <aside className="oe-panel">
            <h3>Clothing library</h3>

            <div className="oe-filter-controls">
              <label className="oe-control">
                <span className="oe-control-label">Search clothes</span>
                <div className="oe-search-box">
                  <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search name, category, colour, gender..."
                    aria-label="Search clothing library"
                  />
                  {search && (
                    <button
                      type="button"
                      className="oe-search-clear"
                      onClick={() => setSearch('')}
                      aria-label="Clear search"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <label className="oe-control">
                <span className="oe-control-label">Category</span>
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value)}
                  aria-label="Filter clothes by category"
                  className="oe-category-select"
                >
                  <option value="All">All categories ({products.length})</option>
                  {categories.map(cat => {
                    const count = products.filter(p => p.category === cat).length
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    )
                  })}
                </select>
              </label>
            </div>

            <div className="oe-library">
              {visibleProducts.map(product => {
                const displayImage = getProductDisplayImage(product)
                return (
                  <button
                    type="button"
                    className="oe-product"
                    key={product.id}
                    onClick={() => addPiece(product)}
                  >
                    <div className="oe-product-thumb-container">
                      <img
                        src={displayImage}
                        alt=""
                        loading="lazy"
                        onLoad={e => {
                          handleImageLoad(
                            product.id,
                            e.currentTarget.naturalWidth,
                            e.currentTarget.naturalHeight,
                          )
                        }}
                        onError={e => {
                          const target = e.currentTarget
                          if (target.src !== product.image && product.image) {
                            target.src = product.image
                          } else if (target.src !== SAFE_PRODUCT_IMAGE_FALLBACK) {
                            target.src = SAFE_PRODUCT_IMAGE_FALLBACK
                          }
                        }}
                      />
                    </div>
                    <span className="oe-product-name">{product.name}</span>
                    <span className="oe-product-meta">
                      {product.gender ? `${product.gender} · ` : ''}{product.category}
                    </span>
                    <small className="oe-product-add">+ Add to look</small>
                  </button>
                )
              })}
            </div>

            {visibleProducts.length === 0 && (
              <div className="oe-empty-state" role="status">
                <p>
                  No clothes found
                  {search ? ` matching "${search}"` : ''}
                  {category !== 'All' ? ` in ${category}` : ''}.
                </p>
                {(search || category !== 'All') && (
                  <button
                    type="button"
                    className="secondary-button oe-clear-filters-btn"
                    onClick={() => {
                      // Resets search and category filter without resetting pieces/outfit
                      setSearch('')
                      setCategory('All')
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </aside>

          <div className="oe-workspace">
            <svg
              ref={svgRef}
              className="oe-canvas"
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              aria-label="Outfit canvas"
              onPointerDown={event => {
                if (event.target === event.currentTarget) {
                  setSelectedId(null)
                }
              }}
              onPointerMove={moveGesture}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
              onLostPointerCapture={() => {
                gesture.current = null
              }}
            >
              {pieces.map(piece => {
                const pieceHeight = getPieceHeight(piece)
                const displayImage = getProductDisplayImage(piece.product)

                return (
                  <g
                    key={piece.id}
                    transform={`rotate(
                      ${piece.rotation}
                      ${piece.x + piece.width / 2}
                      ${piece.y + pieceHeight / 2}
                    )`}
                    role="button"
                    tabIndex={busy ? -1 : 0}
                    aria-label={`Move ${piece.product.name}`}
                    aria-pressed={selectedId === piece.id}
                    className="oe-piece"
                    onPointerDown={event =>
                      beginGesture(event, piece, 'move')
                    }
                    onFocus={() => setSelectedId(piece.id)}
                    onKeyDown={event => {
                      if (busy) return

                      const step = event.shiftKey ? 10 : 2
                      const moves: Record<string, Point> = {
                        ArrowLeft: { x: -step, y: 0 },
                        ArrowRight: { x: step, y: 0 },
                        ArrowUp: { x: 0, y: -step },
                        ArrowDown: { x: 0, y: step },
                      }

                      const delta = moves[event.key]
                      if (!delta) return

                      event.preventDefault()
                      setMessage('')
                      setPieces(current =>
                        current.map(entry => {
                          if (entry.id !== piece.id) return entry
                          const entryHeight = getPieceHeight(entry)
                          return {
                            ...entry,
                            x: clamp(
                              entry.x + delta.x,
                              0,
                              CANVAS_WIDTH - entry.width,
                            ),
                            y: clamp(
                              entry.y + delta.y,
                              0,
                              CANVAS_HEIGHT - entryHeight,
                            ),
                          }
                        }),
                      )
                    }}
                  >
                    <image
                      href={displayImage}
                      x={piece.x}
                      y={piece.y}
                      width={piece.width}
                      height={pieceHeight}
                      preserveAspectRatio="xMidYMid meet"
                      pointerEvents="all"
                      onError={e => {
                        const target = e.currentTarget
                        const currentHref = target.getAttribute('href')
                        if (
                          currentHref !== piece.product.image &&
                          piece.product.image
                        ) {
                          target.setAttribute('href', piece.product.image)
                        } else if (currentHref !== SAFE_PRODUCT_IMAGE_FALLBACK) {
                          target.setAttribute('href', SAFE_PRODUCT_IMAGE_FALLBACK)
                        }
                      }}
                    />
                  </g>
                )
              })}

              {selected && (
                <g
                  transform={`rotate(
                    ${selected.rotation}
                    ${selected.x + selected.width / 2}
                    ${selected.y + selectedHeight / 2}
                  )`}
                >
                  <rect
                    x={selected.x}
                    y={selected.y}
                    width={selected.width}
                    height={selectedHeight}
                    className="oe-selection"
                  />

                  <line
                    x1={selected.x + selected.width / 2}
                    y1={selected.y}
                    x2={selected.x + selected.width / 2}
                    y2={selected.y - 34}
                    className="oe-selection"
                  />

                  {corners.map(corner => (
                    <circle
                      key={corner.name}
                      cx={
                        selected.x +
                        (corner.sx === 1 ? selected.width : 0)
                      }
                      cy={
                        selected.y +
                        (corner.sy === 1 ? selectedHeight : 0)
                      }
                      r={10}
                      className="oe-resize-handle"
                      onPointerDown={event =>
                        beginGesture(
                          event,
                          selected,
                          'resize',
                          corner.sx,
                          corner.sy,
                        )
                      }
                    >
                      <title>Resize from {corner.name}</title>
                    </circle>
                  ))}

                  <circle
                    cx={selected.x + selected.width / 2}
                    cy={selected.y - 34}
                    r={11}
                    className="oe-rotate-handle"
                    onPointerDown={event =>
                      beginGesture(event, selected, 'rotate')
                    }
                  >
                    <title>Rotate this piece</title>
                  </circle>
                </g>
              )}
            </svg>
          </div>

          <aside className="oe-panel">
            <h3>Your look</h3>

            <label className="oe-control">
              <span className="oe-control-label">Look name</span>
              <input
                value={lookName}
                maxLength={80}
                placeholder="For example: Weekend outfit"
                onChange={event => {
                  setLookName(event.target.value)
                  setMessage('')
                }}
              />
            </label>

            <button
              className="primary-button"
              disabled={!lookName.trim() || pieces.length === 0}
              onClick={() => void saveLook()}
            >
              {busy ? 'Saving...' : 'Save look'}
            </button>

            <p role="status">{message}</p>

            {selected ? (
              <>
                <h4>{selected.product.name}</h4>
                <div className="oe-actions">
                  <button
                    className="secondary-button"
                    onClick={() => moveLayer('front')}
                  >
                    Bring to front
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => moveLayer('back')}
                  >
                    Send to back
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() => {
                      setPieces(current =>
                        current.filter(piece => piece.id !== selectedId),
                      )
                      setSelectedId(null)
                      setMessage('')
                    }}
                  >
                    Remove piece
                  </button>
                </div>
              </>
            ) : (
              <p>Select a piece to resize, rotate or change its layer.</p>
            )}
          </aside>
        </div>
      </fieldset>
    </section>
  )
}