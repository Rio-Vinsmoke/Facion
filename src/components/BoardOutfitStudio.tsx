import { useState } from 'react'
import OutfitStudio from '../pages/OutfitStudio'
import type { Look } from '../types/look'
import type { Board } from '../types/board'

export type BoardDestination = {
  boardId: string
  newBoardName?: string
}

type Props = {
  initialLook: Look | null
  boards: Board[]
  onSaveToBoard: (
    look: Look,
    destination: BoardDestination,
  ) => Promise<boolean>
}

const NEW_BOARD = '__new_board__'

export default function BoardOutfitStudio({
  initialLook,
  boards,
  onSaveToBoard,
}: Props) {
  const [selectedBoard, setSelectedBoard] = useState(() =>
    boards.find(board =>
      initialLook ? board.lookIds.includes(initialLook.id) : false,
    )?.id ?? boards[0]?.id ?? NEW_BOARD,
  )
  const [newBoardName, setNewBoardName] = useState('')
  const [newBoardId, setNewBoardId] = useState(
    () => crypto.randomUUID(),
  )
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function saveToBoard(look: Look): Promise<boolean> {
    let destination: BoardDestination
    let boardName: string

    if (selectedBoard === NEW_BOARD) {
      boardName = newBoardName.trim()

      if (!boardName) {
        setMessage('Enter a new board name before saving.')
        return false
      }

      destination = {
        boardId: newBoardId,
        newBoardName: boardName,
      }
    } else {
      const board = boards.find(entry => entry.id === selectedBoard)

      if (!board) {
        setMessage('Choose an existing board or create a new one.')
        return false
      }

      boardName = board.name
      destination = { boardId: board.id }
    }

    setBusy(true)
    setMessage('')

    try {
      const saved = await onSaveToBoard(look, destination)

      if (saved) {
        setSelectedBoard(destination.boardId)
        setNewBoardName('')
        setNewBoardId(crypto.randomUUID())
        setMessage(`Saved to “${boardName}”. Open My Boards to find it.`)
      } else {
        setMessage('Could not complete the save. Check the message above.')
      }

      return saved
    } catch {
      setMessage('Could not save to the board. Please try again.')
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="studio-panel">
        <h3>Save destination</h3>

        <label className="studio-control">
          Board
          <select
            value={selectedBoard}
            disabled={busy}
            onChange={event => {
              setSelectedBoard(event.target.value)
              setMessage('')
            }}
          >
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name}
              </option>
            ))}
            <option value={NEW_BOARD}>+ Create a new board</option>
          </select>
        </label>

        {selectedBoard === NEW_BOARD && (
          <label className="studio-control">
            New board name
            <input
              value={newBoardName}
              maxLength={80}
              disabled={busy}
              placeholder="For example: Weekend outfits"
              onChange={event => {
                setNewBoardName(event.target.value)
                setMessage('')
              }}
            />
          </label>
        )}

        <p>
          Arrange your pieces, enter a look name, then click
          Save look below. It will save to this board.
        </p>

        {message && <p role="status">{message}</p>}
      </section>

      <OutfitStudio
        initialLook={initialLook}
        onSave={saveToBoard}
      />
    </>
  )
}