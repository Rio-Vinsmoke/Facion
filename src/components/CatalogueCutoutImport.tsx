
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

type CutoutRow = {
  sku: string
  relativePath: string
  file: File
  status: 'ready' | 'linked' | 'skipped' | 'failed'
  error: string
}

type ManifestRow = {
  sku: string
  relativePath: string
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').toLowerCase()
}

function relativeCutoutPath(path: string): string {
  const normalized = normalizePath(path)
  const marker = '/processed/'
  const position = normalized.lastIndexOf(marker)

  if (position >= 0) {
    return normalized.slice(position + marker.length)
  }

  if (normalized.startsWith('processed/')) {
    return normalized.slice('processed/'.length)
  }

  return normalized
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(value)
      value = ''
    } else if (
      (char === '\n' || char === '\r') &&
      !quoted
    ) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(value)
      if (row.some(cell => cell.trim())) rows.push(row)
      row = []
      value = ''
    } else {
      value += char
    }
  }

  if (quoted) throw new Error('Unclosed quote in manifest.')

  row.push(value)
  if (row.some(cell => cell.trim())) rows.push(row)

  return rows
}

function readManifest(text: string): ManifestRow[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''))
  if (rows.length < 2) {
    throw new Error('Manifest has no product records.')
  }

  const headers = rows[0].map(value =>
    value.trim().toLowerCase(),
  )

  const skuIndex = headers.indexOf('sku')
  const pathIndex = headers.indexOf('cutout_path')

  if (skuIndex < 0 || pathIndex < 0) {
    throw new Error(
      'Manifest must contain sku and cutout_path columns.',
    )
  }

  const seen = new Set<string>()

  return rows.slice(1).map((row, index) => {
    const sku = (row[skuIndex] ?? '').trim()
    const relativePath = relativeCutoutPath(
      (row[pathIndex] ?? '').trim(),
    )

    if (!/^FAC-IMG-[A-F0-9]{24}$/.test(sku)) {
      throw new Error(`Invalid SKU on manifest row ${index + 2}.`)
    }

    if (
      !relativePath ||
      relativePath.startsWith('/') ||
      relativePath.includes('..') ||
      !relativePath.endsWith('.png')
    ) {
      throw new Error(
        `Invalid cutout path on row ${index + 2}.`,
      )
    }

    if (seen.has(sku)) {
      throw new Error(`Duplicate SKU in manifest: ${sku}`)
    }

    seen.add(sku)
    return { sku, relativePath }
  })
}

export default function CatalogueCutoutImport() {
  const [manifest, setManifest] = useState<ManifestRow[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [rows, setRows] = useState<CutoutRow[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [testMode, setTestMode] = useState(true)

  const busyRef = useRef(false)

  async function selectManifest(file?: File) {
    if (busyRef.current) return

    setRows([])
    setMessage('')
    setManifest([])

    if (!file) return

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Choose cutout_manifest.csv.')
      }

      const parsed = readManifest(await file.text())
      setManifest(parsed)
      setMessage(`${parsed.length} manifest entries loaded.`)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not read manifest.',
      )
    }
  }

  function selectFolder(fileList: FileList | null) {
    if (!fileList || busyRef.current) return

    const selected = Array.from(fileList).filter(
      file => file.name.toLowerCase().endsWith('.png'),
    )

    setFiles(selected)
    setRows([])
    setMessage(`${selected.length} PNG files selected.`)
  }

  function prepareCutouts() {
    if (busyRef.current) return

    const fileMap = new Map<string, File>()
    const duplicates = new Set<string>()

    for (const file of files) {
      const relativePath = relativeCutoutPath(
        file.webkitRelativePath || file.name,
      )

      if (fileMap.has(relativePath)) {
        duplicates.add(relativePath)
      }

      fileMap.set(relativePath, file)
    }

    if (duplicates.size) {
      setMessage('Duplicate file paths detected. Check the folder.')
      return
    }

    const prepared: CutoutRow[] = []
    const missing: string[] = []

    for (const entry of manifest) {
      const file = fileMap.get(entry.relativePath)

      if (!file) {
        missing.push(entry.relativePath)
        continue
      }

      if (
        file.size > 10 * 1024 * 1024 ||
        file.size === 0
      ) {
        missing.push(`${entry.relativePath} (invalid size)`)
        continue
      }

      prepared.push({
        sku: entry.sku,
        relativePath: entry.relativePath,
        file,
        status: 'ready',
        error: '',
      })
    }

    if (missing.length) {
      setRows([])
      setMessage(
        `${missing.length} missing or invalid cutouts. ` +
        `Example: ${missing[0]}. Nothing will be uploaded.`,
      )
      return
    }

    setRows(prepared)
    setProgress(0)
    setMessage(
      `${prepared.length} cutouts matched and ready for review.`,
    )
  }

  function updateRow(
    sku: string,
    status: CutoutRow['status'],
    error = '',
  ) {
    setRows(current =>
      current.map(row =>
        row.sku === sku
          ? { ...row, status, error }
          : row,
      ),
    )
  }

  async function uploadCutouts() {
    if (busyRef.current) return

    const pending = rows.filter(
      row => row.status === 'ready' ||
        row.status === 'failed',
    )

    const batch = testMode ? pending.slice(0, 5) : pending

    if (!batch.length) {
      setMessage('No remaining cutouts to upload.')
      return
    }

    if (!window.confirm(
      `Upload and link ${batch.length} cutouts to FACION?`,
    )) return

    busyRef.current = true
    setBusy(true)
    setProgress(0)

    let linked = 0
    let skipped = 0
    let failed = 0

    try {
      const { data, error: authError } =
        await supabase.auth.getUser()

      if (authError) throw authError
      if (!data.user) {
        throw new Error('Please sign in as a catalogue admin.')
      }

      const userId = data.user.id

      const { data: admin, error: adminError } =
        await supabase
          .from('catalogue_admins')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle()

      if (adminError) throw adminError
      if (!admin) throw new Error('Admin access required.')

      const existing = new Map<
        string,
        { id: string; cutout_image: string | null }
      >()

      for (let i = 0; i < batch.length; i += 50) {
        const part = batch.slice(i, i + 50)

        const { data: products, error } = await supabase
          .from('products')
          .select('id,sku,cutout_image')
          .in('sku', part.map(row => row.sku))

        if (error) throw error

        for (const product of products ?? []) {
          if (product.sku) {
            existing.set(product.sku, {
              id: product.id,
              cutout_image: product.cutout_image,
            })
          }
        }
      }

      for (const row of batch) {
        try {
          const product = existing.get(row.sku)

          if (!product) {
            throw new Error('Matching product not found in Supabase.')
          }

          if (product.cutout_image) {
            skipped++
            updateRow(
              row.sku,
              'skipped',
              'Product already has a cutout.',
            )
            continue
          }

          const path =
            `${userId}/batch/${row.sku}/cutout-${row.sku}.png`

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(path, row.file, {
              contentType: 'image/png',
              upsert: false,
            })

          // A previous upload may have saved the same path.
          if (
            uploadError &&
            String(uploadError.statusCode) !== '409'
          ) {
            throw uploadError
          }

          const { error: linkError } = await supabase.rpc(
            'set_catalogue_product_image',
            {
              p_sku: row.sku,
              p_path: path,
              p_kind: 'cutout',
            },
          )

          if (linkError) throw linkError

          linked++
          updateRow(row.sku, 'linked')
        } catch (error) {
          failed++
          updateRow(
            row.sku,
            'failed',
            error instanceof Error
              ? error.message
              : 'Upload failed.',
          )
        } finally {
          setProgress(value => value + 1)
        }
      }

      setMessage(
        `Completed: ${linked} linked, ` +
        `${skipped} skipped, ${failed} failed.`,
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to start upload.',
      )
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const remaining = rows.filter(
    row => row.status === 'ready' ||
      row.status === 'failed',
  ).length

  return (
    <section className="studio-panel">
      <h3>AI Clothing Cutout Import</h3>

      <p>
        Match processed PNGs with existing FACION products
        and save them as transparent outfit stickers.
      </p>

      <label className="studio-control">
        1. Select cutout_manifest.csv
        <input
          type="file"
          accept=".csv,text/csv"
          disabled={busy}
          onChange={event =>
            void selectManifest(event.target.files?.[0])
          }
        />
      </label>

      <label className="studio-control">
        2. Select processed folder
        <input
          type="file"
          multiple
          disabled={busy}
          {...{ webkitdirectory: '' }}
          onChange={event =>
            selectFolder(event.target.files)
          }
        />
      </label>

      <p>
        Manifest entries: {manifest.length}
        {' · '}
        PNG files: {files.length}
      </p>

      <button
        type="button"
        className="secondary-button"
        disabled={busy || !manifest.length || !files.length}
        onClick={prepareCutouts}
      >
        Match Cutouts
      </button>

      {rows.length > 0 && (
        <>
          <h4>Cutout Import Preview</h4>

          <p>
            {rows.length} matched · {remaining} remaining
          </p>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <input
              type="checkbox"
              checked={testMode}
              disabled={busy}
              onChange={event => setTestMode(event.target.checked)}
            />
            Test mode — upload only 5 cutouts
          </label>

          <button
            type="button"
            className="primary-button"
            disabled={busy || remaining === 0}
            onClick={() => void uploadCutouts()}
          >
            {busy
              ? `Processing ${progress}...`
              : testMode
                ? 'Upload 5 Test Cutouts'
                : `Upload ${remaining} Cutouts`}
          </button>

          <div style={{
            maxHeight: 350,
            overflowY: 'auto',
            marginTop: 20,
          }}>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>File</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(row => (
                  <tr key={row.sku}>
                    <td>{row.sku}</td>
                    <td>{row.relativePath}</td>
                    <td>
                      {row.status}
                      {row.error && (
                        <small style={{ display: 'block' }}>
                          {row.error}
                        </small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {message && (
        <p role="status">{message}</p>
      )}
    </section>
  )
}
