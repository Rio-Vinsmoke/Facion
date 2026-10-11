import { useState } from 'react'
import LookPreview from '../components/LookPreview'
import type { Look } from '../types/look'

type Props = {
  looks: Look[]
  onEdit: (look: Look) => void
  onRename: (id: string, name: string) => Promise<boolean>
onDelete: (id: string) => Promise<boolean>
}

export default function MyLooks({
  looks,
  onEdit,
  onRename,
  onDelete,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  async function renameLook(id: string) {
    const trimmedName = name.trim()
    if (!trimmedName) return

    if (await onRename(id, trimmedName)) {
      setRenamingId(null)
      setMessage('Look renamed.')
    } else {
      setMessage('Could not rename the look.')
    }
  }

  async function deleteLook(look: Look) {
    if (!window.confirm(`Delete "${look.name}" from your saved looks?`)) {
      return
    }

    if (await onDelete(look.id)) {
      if (renamingId === look.id) setRenamingId(null)
      setMessage('Look deleted.')
    } else {
      setMessage('Could not delete the look.')
    }
  }

  return (
    <section>
      <h2>My Looks</h2>

      {message && <p role="status">{message}</p>}

      {looks.length === 0 && (
        <p>Create and save your first outfit in Outfit Studio.</p>
      )}

      <div className="product-grid">
        {looks.map(look => (
          <article className="product-card" key={look.id}>
            <LookPreview look={look} />

            <div className="product-details">
              <h3>{look.name}</h3>
              <p>{look.items.length} pieces</p>

              {renamingId === look.id ? (
                <form
                  onSubmit={event => {
                    event.preventDefault()
                    renameLook(look.id)
                  }}
                >
                  <label>
                    Look name
                    <input
                      value={name}
                      onChange={event => setName(event.target.value)}
                      maxLength={80}
                      autoFocus
                    />
                  </label>

                  <button
                    className="secondary-button"
                    type="submit"
                    disabled={!name.trim()}
                  >
                    Save name
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setRenamingId(null)}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setRenamingId(look.id)
                    setName(look.name)
                    setMessage('')
                  }}
                >
                  Rename
                </button>
              )}

              <button
                className="secondary-button"
                type="button"
                onClick={() => onEdit(look)}
              >
                Edit look
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => deleteLook(look)}
              >
                Delete look
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}