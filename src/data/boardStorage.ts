import type { Board } from '../types/board'

const STORAGE_KEY = 'facion-boards-v1'

function isBoard(value: unknown): value is Board {
  if (!value || typeof value !== 'object') return false

  const board = value as Record<string, unknown>

  return (
    typeof board.id === 'string' &&
    typeof board.name === 'string' &&
    typeof board.createdAt === 'string' &&
    Array.isArray(board.lookIds) &&
    board.lookIds.every((id: unknown) => typeof id === 'string')
  )
}

export function loadBoards(): Board[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    )

    return Array.isArray(stored) ? stored.filter(isBoard) : []
  } catch {
    return []
  }
}

export function saveBoards(boards: Board[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(boards))
    return true
  } catch {
    return false
  }
}