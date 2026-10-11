import { useState } from 'react'
import LookPreview from '../components/LookPreview'
import type { Board } from '../types/board'
import type { Look } from '../types/look'

type Props = {
  boards: Board[]
  looks: Look[]
  onSave: (boards: Board[]) => Promise<boolean>
  onEditLook: (look: Look) => void
}

export default function MyBoards({
  boards,
  looks,
  onSave,
  onEditLook,
}: Props) {
  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [message, setMessage] = useState('')

  const selectedBoard = boards.find(board => board.id === selectedId)

  async function createBoard() {
    const trimmedName = name.trim()
    if (!trimmedName) return

    const board: Board = {
      id: crypto.randomUUID(),
      name: trimmedName,
      lookIds: [],
      createdAt: new Date().toISOString(),
    }

    if (await onSave([...boards, board])) {
      setName('')
      setSelectedId(board.id)
      setRenameValue(board.name)
      setMessage('')
    } else {
      setMessage('Could not save the board. Please try again.')
    }
  }

  async function renameBoard() {
    const trimmedName = renameValue.trim()
    if (!selectedBoard || !trimmedName) return

    const nextBoards = boards.map(board =>
      board.id === selectedBoard.id
        ? { ...board, name: trimmedName }
        : board
    )

    if (await onSave(nextBoards)) {
      setRenameValue(trimmedName)
      setMessage('Board renamed.')
    } else {
      setMessage('Could not rename the board.')
    }
  }

  async function deleteBoard() {
    if (!selectedBoard) return

    const confirmed = window.confirm(
      `Delete "${selectedBoard.name}"? Your saved outfits will be kept.`
    )

    if (!confirmed) return

    const nextBoards = boards.filter(
      board => board.id !== selectedBoard.id
    )

    if (await onSave(nextBoards)) {
      setSelectedId(null)
      setRenameValue('')
      setMessage('Board deleted. Your outfits are still in My Looks.')
    } else {
      setMessage('Could not delete the board.')
    }
  }

  async function toggleLook(lookId: string) {
    if (!selectedBoard) return

    const nextBoards = boards.map(board => {
      if (board.id !== selectedBoard.id) return board

      return {
        ...board,
        lookIds: board.lookIds.includes(lookId)
          ? board.lookIds.filter(id => id !== lookId)
          : [...board.lookIds, lookId],
      }
    })

    setMessage(
  (await onSave(nextBoards)) ? '' : 'Could not save your changes.'
)
  }

  return (
    <section>
      <h2>My Boards</h2>

      <form
        className="filters"
        onSubmit={event => {
          event.preventDefault()
          createBoard()
        }}
      >
        <label>
          Board name
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Winter, College, Date Night..."
            maxLength={80}
          />
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={!name.trim()}
        >
          Create board
        </button>
      </form>

      {message && <p role="status">{message}</p>}

      {boards.length === 0 && (
        <p>Create your first board to organize your outfits.</p>
      )}

      <div className="product-grid">
        {boards.map(board => (
          <article className="product-card" key={board.id}>
            <div className="product-details">
              <h3>{board.name}</h3>

              <p>
                {looks.filter(look => board.lookIds.includes(look.id)).length}
                {' '}saved looks
              </p>

              <button
                className="secondary-button"
                type="button"
                aria-pressed={selectedId === board.id}
                onClick={() => {
                  setSelectedId(board.id)
                  setRenameValue(board.name)
                  setMessage('')
                }}
              >
                Open board
              </button>
            </div>
          </article>
        ))}
      </div>

      {selectedBoard && (
        <section>
          <h3>{selectedBoard.name}</h3>

          <form
            className="filters"
            onSubmit={event => {
              event.preventDefault()
              renameBoard()
            }}
          >
            <label>
              Rename board
              <input
                value={renameValue}
                onChange={event => setRenameValue(event.target.value)}
                maxLength={80}
              />
            </label>

            <button
              className="secondary-button"
              type="submit"
              disabled={
                !renameValue.trim() ||
                renameValue.trim() === selectedBoard.name
              }
            >
              Save name
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={deleteBoard}
            >
              Delete board
            </button>
          </form>

          <p>Tick a saved look to add it. Untick it to remove it.</p>

          {looks.length === 0 && (
            <p>Save an outfit in Outfit Studio first.</p>
          )}

          <div className="product-grid">
            {looks.map(look => (
              <article className="product-card" key={look.id}>
                <LookPreview look={look} />

                <div className="product-details">
                  <h4>{look.name}</h4>

                  <label>
                    <input
                      type="checkbox"
                      checked={selectedBoard.lookIds.includes(look.id)}
                      onChange={() => toggleLook(look.id)}
                    />
                    {' '}Include in this board
                  </label>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => onEditLook(look)}
                  >
                    Edit look
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}