import { supabase } from '../lib/supabase'
import type { Look } from '../types/look'
import type { Board } from '../types/board'

type LookRow = {
  id: string
  name: string
  items: Look['items']
  updated_at: string
}

type BoardRow = {
  id: string
  name: string
  look_ids: string[]
  created_at: string
}

export async function fetchCloudLooks(userId: string): Promise<Look[]> {
  const { data, error } = await supabase
    .from('looks')
    .select('id, name, items, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .returns<LookRow[]>()

  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    items: row.items,
    updatedAt: row.updated_at,
  }))
}

export async function saveCloudLook(
  userId: string,
  look: Look
): Promise<void> {
  const { error } = await supabase.from('looks').upsert(
    {
      user_id: userId,
      id: look.id,
      name: look.name,
      items: look.items,
      updated_at: look.updatedAt,
    },
    { onConflict: 'user_id,id' }
  )

  if (error) throw error
}

export async function deleteCloudLook(
  userId: string,
  lookId: string
): Promise<void> {
  const { error } = await supabase
    .from('looks')
    .delete()
    .eq('user_id', userId)
    .eq('id', lookId)

  if (error) throw error
}

export async function fetchCloudBoards(userId: string): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('id, name, look_ids, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .returns<BoardRow[]>()

  if (error) throw error

  return (data ?? []).map(row => ({
    id: row.id,
    name: row.name,
    lookIds: row.look_ids,
    createdAt: row.created_at,
  }))
}

export async function saveCloudBoard(
  userId: string,
  board: Board
): Promise<void> {
  const { error } = await supabase.from('boards').upsert(
    {
      user_id: userId,
      id: board.id,
      name: board.name,
      look_ids: board.lookIds,
      created_at: board.createdAt,
    },
    { onConflict: 'user_id,id' }
  )

  if (error) throw error
}

export async function deleteCloudBoard(
  userId: string,
  boardId: string
): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .delete()
    .eq('user_id', userId)
    .eq('id', boardId)

  if (error) throw error
}
export async function importBrowserCollections(
  userId: string,
  looks: Look[],
  boards: Board[],
): Promise<void> {
  if (looks.length > 0) {
    const { error } = await supabase.from('looks').upsert(
      looks.map(look => ({
        user_id: userId,
        id: look.id,
        name: look.name,
        items: look.items,
        updated_at: look.updatedAt,
      })),
      {
        onConflict: 'user_id,id',
        ignoreDuplicates: true,
      },
    )

    if (error) throw error
  }

  if (boards.length > 0) {
    const { error } = await supabase.from('boards').upsert(
      boards.map(board => ({
        user_id: userId,
        id: board.id,
        name: board.name,
        look_ids: board.lookIds,
        created_at: board.createdAt,
      })),
      {
        onConflict: 'user_id,id',
        ignoreDuplicates: true,
      },
    )

    if (error) throw error
  }
}