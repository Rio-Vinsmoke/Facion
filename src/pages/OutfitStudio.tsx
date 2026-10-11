import { useEffect, useRef, useState } from 'react'

import type { PointerEvent as ReactPointerEvent } from 'react'

import { fetchProducts } from '../data/productStorage'

import type { Product } from '../types/product'

import type { Look } from '../types/look'

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



    setLoading(true)

    setError('')



    async function load() {

      try {

        const catalogue = await fetchProducts()

        if (!cancelled) setProducts(catalogue)

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

          onClick={() => setReload(value => value + 1)}

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

  const [lookId] = useState(

    () => initialLook?.id ?? crypto.randomUUID(),

  )

  const [lookName, setLookName] = useState(initialLook?.name ?? '')

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [search, setSearch] = useState('')

  const [message, setMessage] = useState('')

  const [busy, setBusy] = useState(false)



  const [pieces, setPieces] = useState<Piece[]>(() =>

    (initialLook?.items ?? []).flatMap(item => {

      const product = products.find(

        entry => entry.id === item.productId,

      )



      return product

        ? [{

            id: item.id,

            product,

            x: item.x,

            y: item.y,

            width: item.width,

            rotation: item.rotation,

          }]

        : []

    }),

  )



  const svgRef = useRef<SVGSVGElement | null>(null)

  const gesture = useRef<Gesture | null>(null)

  const saving = useRef(false)



  const selected = pieces.find(piece => piece.id === selectedId)

  const visibleProducts = products.filter(product =>

    product.name.toLowerCase().includes(search.trim().toLowerCase()),

  )



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

      y: 200,

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



    const angle = piece.rotation * Math.PI / 180

    const cos = Math.cos(angle)

    const sin = Math.sin(angle)

    const centerX = piece.x + piece.width / 2

    const centerY = piece.y + piece.width / 2



    gesture.current = {

      pointerId: event.pointerId,

      mode,

      original: { ...piece },

      start,

      sx,

      sy,

      anchor: {

        x: centerX - cos * sx * piece.width / 2

          + sin * sy * piece.width / 2,

        y: centerY - sin * sx * piece.width / 2

          - cos * sy * piece.width / 2,

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

          CANVAS_HEIGHT - original.width,

        ),

      }

    } else if (active.mode === 'resize') {

      const angle = original.rotation * Math.PI / 180

      const cos = Math.cos(angle)

      const sin = Math.sin(angle)

      const dx = point.x - active.anchor.x

      const dy = point.y - active.anchor.y



      const localX = cos * dx + sin * dy

      const localY = -sin * dx + cos * dy



      const width = clamp(

        (active.sx * localX + active.sy * localY) / 2,

        MIN_SIZE,

        MAX_SIZE,

      )



      const centerX = active.anchor.x

        + cos * active.sx * width / 2

        - sin * active.sy * width / 2



      const centerY = active.anchor.y

        + sin * active.sx * width / 2

        + cos * active.sy * width / 2



      changes = {

        width,

        x: centerX - width / 2,

        y: centerY - width / 2,

      }

    } else {

      const centerX = original.x + original.width / 2

      const centerY = original.y + original.width / 2

      const angle = Math.atan2(point.y - centerY, point.x - centerX)



      const degrees = original.rotation

        + (angle - active.startAngle) * 180 / Math.PI



      changes = {

        rotation: ((degrees + 180) % 360 + 360) % 360 - 180,

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



            <label className="oe-control">

              Search clothes

              <input

                type="search"

                value={search}

                onChange={event => setSearch(event.target.value)}

                placeholder="Search your clothes"

              />

            </label>



            <div className="oe-library">

              {visibleProducts.map(product => (

                <button

                  type="button"

                  className="oe-product"

                  key={product.id}

                  onClick={() => addPiece(product)}

                >

                  <img src={product.cutout_image || product.image} alt="" />

                  <span>{product.name}</span>

                  <small>+ Add to look</small>

                </button>

              ))}

            </div>



            {visibleProducts.length === 0 && (

              <p>No matching clothes.</p>

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

              {pieces.map(piece => (

                <g

                  key={piece.id}

                  transform={`rotate(

                    ${piece.rotation}

                    ${piece.x + piece.width / 2}

                    ${piece.y + piece.width / 2}

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

                      current.map(entry =>

                        entry.id === piece.id

                          ? {

                              ...entry,

                              x: clamp(

                                entry.x + delta.x,

                                0,

                                CANVAS_WIDTH - entry.width,

                              ),

                              y: clamp(

                                entry.y + delta.y,

                                0,

                                CANVAS_HEIGHT - entry.width,

                              ),

                            }

                          : entry,

                      ),

                    )

                  }}

                >

                  <image

                    href={piece.product.cutout_image || piece.product.image}

                    x={piece.x}

                    y={piece.y}

                    width={piece.width}

                    height={piece.width}

                    preserveAspectRatio="xMidYMid meet"

                    pointerEvents="all"

                  />

                </g>

              ))}



              {selected && (

                <g

                  transform={`rotate(

                    ${selected.rotation}

                    ${selected.x + selected.width / 2}

                    ${selected.y + selected.width / 2}

                  )`}

                >

                  <rect

                    x={selected.x}

                    y={selected.y}

                    width={selected.width}

                    height={selected.width}

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

                        selected.x

                        + (corner.sx === 1 ? selected.width : 0)

                      }

                      cy={

                        selected.y

                        + (corner.sy === 1 ? selected.width : 0)

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

              Look name

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