import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { fetchProducts, getSizeStock } from './data/productStorage'
import { loadCart, saveCart } from './data/cartStorage'
import { loadLooks, saveLooks } from './data/lookStorage'
import { loadBoards, saveBoards } from './data/boardStorage'
import { placeTestOrder, clearOrderRequest } from './data/orderStorage'
import {
  fetchCloudLooks,
  saveCloudLook,
  deleteCloudLook,
  fetchCloudBoards,
  saveCloudBoard,
  deleteCloudBoard,
  importBrowserCollections,
} from './data/cloudStorage'
import Header, { type Page } from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Categories from './pages/Categories'
import Collections from './pages/Collections'
import OutfitPromo from './pages/OutfitPromo'
import Shop from './pages/Shop'
import Wishlist from './pages/Wishlist'
import { loadWishlist, saveWishlist } from './data/wishlistStorage'
import Bag from './pages/Bag'
import Checkout from './pages/Checkout'
import BoardOutfitStudio, {
  type BoardDestination,
} from './components/BoardOutfitStudio'
import MyLooks from './pages/MyLooks'
import MyBoards from './pages/MyBoards'
import Account from './pages/Account'
import type { Product } from './types/product'
import type { CartItem } from './types/cart'
import type { Look } from './types/look'
import type { Board } from './types/board'
import type { Session } from '@supabase/supabase-js'
import Auth, { type AuthMode } from './pages/Auth'

function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('Home')
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [catalogue, setCatalogue] = useState<Product[] | null>(null)
  const [catalogueError, setCatalogueError] = useState('')
  const [catalogueReload, setCatalogueReload] = useState(0)
  const [pendingCheckoutRedirect, setPendingCheckoutRedirect] = useState(false)
  const [shopFilters, setShopFilters] = useState<{
    category?: string
    gender?: string
    search?: string
  }>({})
  const [selectedProductForShop, setSelectedProductForShop] = useState<Product | null>(null)

  useEffect(() => {
    // Detect password recovery callback in URL
    const hash = window.location.hash
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      setAuthMode('reset')
    }

    // Resolve initial Supabase session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setSession(null)
      } else {
        setSession(data.session)
      }
    })

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset')
      }
      setSession(nextSession)
      if (event === 'SIGNED_IN') {
        if (pendingCheckoutRedirect) {
          setActivePage('Checkout')
          setPendingCheckoutRedirect(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setPendingCheckoutRedirect(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [pendingCheckoutRedirect])

  // Fetch catalogue for both guests and authenticated users
  useEffect(() => {
    if (session === undefined) return
    let cancelled = false
    setCatalogueError('')
    async function loadCatalogue() {
      try {
        const products = await fetchProducts()
        if (!cancelled) setCatalogue(products)
      } catch (error) {
        if (!cancelled) setCatalogueError(errorMessage(error))
      }
    }
    void loadCatalogue()
    return () => {
      cancelled = true
    }
  }, [session, catalogueReload])

  function handleNavigate(
    page: Page,
    options?: {
      category?: string
      gender?: string
      search?: string
      product?: Product
    },
  ) {
    if (
      options?.category !== undefined ||
      options?.gender !== undefined ||
      options?.search !== undefined
    ) {
      setShopFilters({
        category: options.category,
        gender: options.gender,
        search: options.search,
      })
    }
    if (options?.product) {
      setSelectedProductForShop(options.product)
    }
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 1. Initial Supabase session resolution (prevent brief flash)
  if (session === undefined) {
    return (
      <div className="facion-app-loading" role="status" aria-live="polite">
        <div className="facion-brand-header">
          <h1 className="facion-brand-title">FACION</h1>
          <p className="facion-brand-subtitle">Fashion for Every You</p>
        </div>
        <div className="facion-loading-spinner" aria-label="Resolving session..." />
      </div>
    )
  }

  // 2. Error loading catalogue
  if (catalogueError) {
    return (
      <main className="facion-container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '3rem', marginBottom: '16px' }}>FACION</h1>
        <p role="alert" style={{ marginBottom: '24px', color: '#b91c1c' }}>
          Could not load the catalogue. {catalogueError}
        </p>
        <button
          className="glass-glow-btn"
          onClick={() => setCatalogueReload(value => value + 1)}
        >
          Try again
        </button>
      </main>
    )
  }

  // 3. Loading catalogue (for both guests and authenticated customers)
  if (catalogue === null) {
    return (
      <div className="facion-app-loading" role="status" aria-live="polite">
        <div className="facion-brand-header">
          <h1 className="facion-brand-title">FACION</h1>
          <p className="facion-brand-subtitle">Loading Catalogue...</p>
        </div>
        <div className="facion-loading-spinner" aria-label="Loading catalogue..." />
      </div>
    )
  }

  // 4. Public storefront open to all visitors (guest & authenticated)
  return (
    <FacionApp
      key={session ? session.user.id : 'guest'}
      userId={session ? session.user.id : null}
      session={session}
      catalogue={catalogue}
      activePage={activePage}
      onNavigate={handleNavigate}
      shopFilters={shopFilters}
      selectedProductForShop={selectedProductForShop}
      onClearSelectedProduct={() => setSelectedProductForShop(null)}
      pendingCheckoutRedirect={pendingCheckoutRedirect}
      setPendingCheckoutRedirect={setPendingCheckoutRedirect}
      authMode={authMode}
      onAuthSuccess={nextSession => {
        setSession(nextSession)
        if (pendingCheckoutRedirect) {
          setActivePage('Checkout')
          setPendingCheckoutRedirect(false)
        }
      }}
    />
  )
}

type AppProps = {
  userId: string | null
  session: Session | null
  catalogue: Product[]
  activePage: Page
  onNavigate: (
    page: Page,
    options?: {
      category?: string
      gender?: string
      search?: string
      product?: Product
    },
  ) => void
  shopFilters: {
    category?: string
    gender?: string
    search?: string
  }
  selectedProductForShop: Product | null
  onClearSelectedProduct: () => void
  pendingCheckoutRedirect: boolean
  setPendingCheckoutRedirect: (value: boolean) => void
  authMode: AuthMode
  onAuthSuccess: (session: Session) => void
}

function FacionApp({
  userId,
  session,
  catalogue,
  activePage,
  onNavigate,
  shopFilters,
  selectedProductForShop,
  onClearSelectedProduct,
  pendingCheckoutRedirect,
  setPendingCheckoutRedirect,
  authMode,
  onAuthSuccess,
}: AppProps) {
  const [cart, setCart] = useState<CartItem[]>(() => loadCart(catalogue))
  const [cartSaveFailed, setCartSaveFailed] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadWishlist(userId))
  const [wishlistSaveFailed, setWishlistSaveFailed] = useState(false)
  const [looks, setLooks] = useState<Look[]>(
    () => userId ? [] : loadLooks(),
  )
  const [boards, setBoards] = useState<Board[]>(
    () => userId ? [] : loadBoards(),
  )
  const [editorLook, setEditorLook] = useState<Look | null>(null)
  const [studioSession, setStudioSession] = useState(0)
  const [ready, setReady] = useState(!userId)
  const [busy, setBusy] = useState(false)
  const [orderBusy, setOrderBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [reload, setReload] = useState(0)
  const saving = useRef(false)
  const placingOrder = useRef(false)
  useEffect(() => {
    setCartSaveFailed(!saveCart(cart))
  }, [cart])
  useEffect(() => {
    setWishlistSaveFailed(!saveWishlist(userId, favoriteIds))
  }, [userId, favoriteIds])
  function toggleFavorite(productId: string) {
    setFavoriteIds(current => current.includes(productId)
      ? current.filter(id => id !== productId)
      : [...current, productId])
  }
  useEffect(() => {
    if (!userId) return
    const ownerId = userId
    let cancelled = false
    setReady(false)
    setMessage('Loading your saved looks and boards...')
    async function load() {
      try {
        const [cloudLooks, cloudBoards] = await Promise.all([
          fetchCloudLooks(ownerId),
          fetchCloudBoards(ownerId),
        ])
        if (cancelled) return
        setLooks(cloudLooks)
        setBoards(cloudBoards)
        setReady(true)
        setMessage('')
      } catch (error) {
        if (!cancelled) setMessage(errorMessage(error))
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId, reload])
  async function runSave(
    operation: () => Promise<void>,
  ): Promise<boolean> {
    if (!ready || saving.current) return false
    saving.current = true
    setBusy(true)
    setMessage('')
    try {
      await operation()
      return true
    } catch (error) {
      setMessage(errorMessage(error))
      if (userId) setReady(false)
      return false
    } finally {
      saving.current = false
      setBusy(false)
    }
  }
  async function importBrowserData(): Promise<void> {
    if (!userId || !ready || saving.current) return
    const browserLooks = loadLooks()
    const browserBoards = loadBoards()
    if (browserLooks.length === 0 && browserBoards.length === 0) {
      setMessage('There are no browser-saved looks or boards to import.')
      return
    }
    const saved = await runSave(async () => {
      await importBrowserCollections(userId, browserLooks, browserBoards)
      const [cloudLooks, cloudBoards] = await Promise.all([
        fetchCloudLooks(userId),
        fetchCloudBoards(userId),
      ])
      setLooks(cloudLooks)
      setBoards(cloudBoards)
    })
    if (saved) {
      setMessage(
        'Import complete. Your browser collections are available in your account.',
      )
    }
  }
  async function saveLook(look: Look): Promise<boolean> {
    return runSave(async () => {
      if (userId) {
        await saveCloudLook(userId, look)
      } else {
        const nextLooks = [
          look,
          ...looks.filter(entry => entry.id !== look.id),
        ]
        if (!saveLooks(nextLooks)) {
          throw new Error('Your browser could not save the look.')
        }
      }
      setLooks(current => [
        look,
        ...current.filter(entry => entry.id !== look.id),
      ])
    })
  }
  async function saveLookToBoard(
    look: Look,
    destination: BoardDestination,
  ): Promise<boolean> {
    const existingBoard = boards.find(
      board => board.id === destination.boardId,
    )
    const newName = destination.newBoardName?.trim()
    if (!existingBoard && !newName) {
      setMessage('That board is unavailable. Choose another board.')
      return false
    }
    return runSave(async () => {
      if (userId) {
        const { error } = await supabase.rpc('save_look_to_board', {
          p_look_id: look.id,
          p_look_name: look.name,
          p_items: look.items,
          p_board_id: destination.boardId,
          p_board_name: newName ?? null,
        })
        if (error) throw error
        const [cloudLooks, cloudBoards] = await Promise.all([
          fetchCloudLooks(userId),
          fetchCloudBoards(userId),
        ])
        setLooks(cloudLooks)
        setBoards(cloudBoards)
      } else {
        const board: Board = existingBoard ?? {
          id: destination.boardId,
          name: newName as string,
          lookIds: [],
          createdAt: new Date().toISOString(),
        }
        const updatedBoard: Board = {
          ...board,
          lookIds: [...new Set([...board.lookIds, look.id])],
        }
        const nextLooks = [
          look,
          ...looks.filter(entry => entry.id !== look.id),
        ]
        const nextBoards = existingBoard
          ? boards.map(entry =>
              entry.id === updatedBoard.id ? updatedBoard : entry,
            )
          : [...boards, updatedBoard]
        if (!saveLooks(nextLooks)) {
          throw new Error('Your browser could not save the look.')
        }
        setLooks(nextLooks)
        if (!saveBoards(nextBoards)) {
          throw new Error(
            'The look was saved, but the board could not be saved. Please retry.',
          )
        }
        setBoards(nextBoards)
      }
    })
  }
  async function renameSavedLook(
    id: string,
    name: string,
  ): Promise<boolean> {
    const look = looks.find(entry => entry.id === id)
    const trimmedName = name.trim()
    if (!look || !trimmedName) return false
    return saveLook({
      ...look,
      name: trimmedName,
      updatedAt: new Date().toISOString(),
    })
  }
  async function deleteSavedLook(id: string): Promise<boolean> {
    return runSave(async () => {
      const nextLooks = looks.filter(look => look.id !== id)
      if (userId) {
        await deleteCloudLook(userId, id)
      } else if (!saveLooks(nextLooks)) {
        throw new Error('Your browser could not delete the look.')
      }
      setLooks(nextLooks)
      if (editorLook?.id === id) {
        setEditorLook(null)
        setStudioSession(value => value + 1)
      }
    })
  }
  async function updateBoards(nextBoards: Board[]): Promise<boolean> {
    return runSave(async () => {
      if (userId) {
        for (const board of boards) {
          if (!nextBoards.some(entry => entry.id === board.id)) {
            await deleteCloudBoard(userId, board.id)
          }
        }
        for (const board of nextBoards) {
          const previous = boards.find(entry => entry.id === board.id)
          if (JSON.stringify(previous) !== JSON.stringify(board)) {
            await saveCloudBoard(userId, board)
          }
        }
      } else if (!saveBoards(nextBoards)) {
        throw new Error('Your browser could not save the boards.')
      }
      setBoards(nextBoards)
    })
  }
  function editLook(look: Look) {
    setEditorLook(look)
    setStudioSession(value => value + 1)
    onNavigate('Outfit Studio')
  }
  function startNewLook() {
    setEditorLook(null)
    setStudioSession(value => value + 1)
    onNavigate('Outfit Studio')
  }
  const wishlistCount = favoriteIds.filter(id => catalogue.some(product => product.id === id)).length
  const bagCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  function addToBag(product: Product, size: string) {
    if (placingOrder.current) return
    const limit = Math.min(getSizeStock(product, size), 10)
    if (limit < 1) return
    setCart(items => {
      const existing = items.find(
        item => item.product.id === product.id && item.size === size,
      )
      if (existing) {
        return items.map(item =>
          item.product.id === product.id && item.size === size
            ? {
                ...item,
                product,
                quantity: Math.min(item.quantity + 1, limit),
              }
            : item,
        )
      }
      return [...items, { product, size, quantity: 1 }]
    })
    onNavigate('Bag')
  }
  function changeQuantity(
    productId: string,
    size: string,
    quantity: number,
  ) {
    if (placingOrder.current) return
    if (!Number.isInteger(quantity) || quantity < 1) return
    setCart(items =>
      items.map(item => {
        if (item.product.id !== productId || item.size !== size) {
          return item
        }
        const limit = Math.min(getSizeStock(item.product, size), 10)
        return quantity > limit ? item : { ...item, quantity }
      }),
    )
  }
  function removeItem(productId: string, size: string) {
    if (placingOrder.current) return
    setCart(items =>
      items.filter(
        item => !(item.product.id === productId && item.size === size),
      ),
    )
  }
  function openCheckout() {
    if (cart.length === 0) return
    const hasStockIssue = cart.some(
      item => item.quantity > getSizeStock(item.product, item.size),
    )
    if (!hasStockIssue) onNavigate('Checkout')
  }
  async function submitTestOrder(): Promise<string> {
    if (!userId) throw new Error('Sign in before placing an order.')
    if (cart.length === 0) throw new Error('Your bag is empty.')
    if (placingOrder.current) {
      throw new Error('An order is already being placed.')
    }
    placingOrder.current = true
    setOrderBusy(true)
    try {
      const orderId = await placeTestOrder(userId, cart)
      const cleared = saveCart([])
      setCartSaveFailed(!cleared)
      setCart([])
      if (cleared) clearOrderRequest(userId)
      return orderId
    } finally {
      placingOrder.current = false
      setOrderBusy(false)
    }
  }
  const collectionsPage =
    activePage === 'Outfit Studio' ||
    activePage === 'My Looks' ||
    activePage === 'My Boards'
  return (
    <div className="facion-app-wrapper">
      <Header
        activePage={activePage}
        onNavigate={page => onNavigate(page)}
        wishlistCount={wishlistCount}
        bagCount={bagCount}
        session={session}
      />

      <main className="facion-main-content">
        {wishlistSaveFailed && (
          <div className="facion-container" style={{ padding: '16px' }}>
            <p role="alert" style={{ color: '#b91c1c' }}>
              Your browser could not save the wishlist.
            </p>
          </div>
        )}
        {cartSaveFailed && (
          <div className="facion-container" style={{ padding: '16px' }}>
            <p role="alert" style={{ color: '#b91c1c' }}>
              Your browser could not save the bag. Bag changes may not survive a refresh.
            </p>
          </div>
        )}

        {/* 1. Home Page (Default) */}
        {activePage === 'Home' && (
          <Home
            catalogue={catalogue}
            onNavigate={onNavigate}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            onSelectProduct={product => {
              onNavigate('Shop', { product })
            }}
          />
        )}

        {/* 2. Shop Page */}
        {activePage === 'Shop' && (
          <Shop
            userId={userId}
            onAddToBag={addToBag}
            onNavigateToAccount={() => onNavigate('Account')}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            initialCategory={shopFilters.category}
            initialGender={shopFilters.gender}
            initialSearch={shopFilters.search}
            externalSelectedProduct={selectedProductForShop}
            onClearExternalSelectedProduct={onClearSelectedProduct}
          />
        )}

        {/* 3. Categories Page */}
        {activePage === 'Categories' && (
          <Categories
            catalogue={catalogue}
            onNavigate={onNavigate}
          />
        )}

        {/* 4. Collections Page */}
        {activePage === 'Collections' && (
          <Collections
            onNavigate={onNavigate}
          />
        )}

        {/* 5. Outfit Builder Promotional Page */}
        {activePage === 'Outfit Builder' && (
          <OutfitPromo
            onNavigate={page => onNavigate(page)}
          />
        )}

        {/* 6. Wishlist Page */}
        {activePage === 'Wishlist' && (
          <Wishlist
            products={catalogue}
            favoriteIds={favoriteIds}
            onRemove={toggleFavorite}
            onShop={() => onNavigate('Shop')}
          />
        )}

        {/* 7. Bag Page */}
        {activePage === 'Bag' && (
          <Bag
            items={cart}
            onQuantityChange={changeQuantity}
            onRemove={removeItem}
            onCheckout={openCheckout}
          />
        )}

        {/* 8. Checkout Page */}
        {activePage === 'Checkout' && (
          <Checkout
            userId={userId}
            items={cart}
            onBackToBag={() => onNavigate('Bag')}
            onSignIn={() => {
              setPendingCheckoutRedirect(true)
              onNavigate('Account')
            }}
            onPlaceOrder={submitTestOrder}
          />
        )}

        {/* 9. Account Page */}
        {activePage === 'Account' && (
          <Account
            session={session}
            returnToCheckout={pendingCheckoutRedirect}
            onAuthSuccess={nextSession => {
              onAuthSuccess(nextSession)
              if (pendingCheckoutRedirect) {
                setPendingCheckoutRedirect(false)
                onNavigate('Checkout')
              }
            }}
          />
        )}

        {/* 10. Direct Auth Page Fallback */}
        {activePage === 'Auth' && (
          <Auth
            initialMode={authMode}
            onAuthSuccess={nextSession => {
              onAuthSuccess(nextSession)
              if (pendingCheckoutRedirect) {
                setPendingCheckoutRedirect(false)
                onNavigate('Checkout')
              } else {
                onNavigate('Home')
              }
            }}
          />
        )}

        {/* 11. Interactive Outfit Studio, My Looks, My Boards */}
        {collectionsPage && (
          <div className="facion-container" style={{ padding: '24px 16px' }}>
            <p style={{ color: 'var(--color-charcoal)', opacity: 0.8 }}>
              {userId
                ? 'Looks and boards are saved to your account.'
                : 'Guest mode: looks and boards are saved in this browser.'}
            </p>
            {message && <p role="status">{message}</p>}
            {busy && <p role="status">Saving...</p>}
            {userId && !ready && !busy && (
              <button
                className="secondary-button"
                onClick={() => setReload(value => value + 1)}
              >
                Reload saved data
              </button>
            )}
          </div>
        )}

        <fieldset
          disabled={!ready || busy || orderBusy}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          {userId &&
            ready &&
            (activePage === 'My Looks' || activePage === 'My Boards') && (
              <div className="facion-container" style={{ padding: '16px' }}>
                <button
                  className="secondary-button"
                  onClick={() => void importBrowserData()}
                >
                  Import browser looks and boards
                </button>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-warm-brown)', marginTop: '8px' }}>
                  Copy collections saved in this browser into your account.
                  Existing account entries are kept.
                </p>
              </div>
            )}

          <div hidden={activePage !== 'Outfit Studio'}>
            <div className="facion-container" style={{ padding: '16px 24px 0' }}>
              <button
                className="secondary-button"
                onClick={startNewLook}
              >
                Start a new look
              </button>
            </div>
            {ready && (
              <BoardOutfitStudio
                key={studioSession}
                initialLook={editorLook}
                boards={boards}
                onSaveToBoard={saveLookToBoard}
              />
            )}
          </div>

          {activePage === 'My Looks' && ready && (
            <MyLooks
              looks={looks}
              onEdit={editLook}
              onRename={renameSavedLook}
              onDelete={deleteSavedLook}
            />
          )}

          {activePage === 'My Boards' && ready && (
            <MyBoards
              boards={boards}
              looks={looks}
              onSave={updateBoards}
              onEditLook={editLook}
            />
          )}
        </fieldset>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  )
}