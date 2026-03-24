import { useState } from 'react'
import { useFetch, useMutation } from '../hooks/useFetch.js'
import { getSchemes, getSchemeStates, createScheme, updateScheme } from '../api.js'
import { Plus, Pencil, RefreshCw, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import { useToast } from '../components/Toast.jsx'

const PAGE_SIZE_OPTIONS = ['25', '50', '100', 'full']
const EMPTY = {
  schemeTitle: '', schemetype: 'Scholarship', state: '', city: '',
  requiredDocs: '', process: '', schemeStartDate: '', schemeLastDate: '',
  applyLink: '', aboutScheme: '',
}
const prettyJson = (value) => JSON.stringify(value, null, 2)

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

async function readClipboardText() {
  if (navigator.clipboard?.readText) return navigator.clipboard.readText()
  const manual = window.prompt('Clipboard paste supported nahi mila. Yahan JSON paste karein:')
  return manual ?? ''
}

function createPayloadFromForm(form) {
  return {
    ...form,
    requiredDocs: form.requiredDocs
      ? form.requiredDocs.split(',').map(d => d.trim()).filter(Boolean)
      : [],
  }
}

function formFromPayload(payload = {}) {
  return {
    schemeTitle: payload.schemeTitle || '',
    schemetype: payload.schemetype || 'Scholarship',
    state: payload.state || '',
    city: payload.city || '',
    requiredDocs: Array.isArray(payload.requiredDocs) ? payload.requiredDocs.join(', ') : (payload.requiredDocs || ''),
    process: payload.process || '',
    schemeStartDate: payload.schemeStartDate?.slice?.(0, 10) || payload.schemeStartDate || '',
    schemeLastDate: payload.schemeLastDate?.slice?.(0, 10) || payload.schemeLastDate || '',
    applyLink: payload.applyLink || '',
    aboutScheme: payload.aboutScheme || '',
  }
}

export default function Schemes() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('25')
  const [filterState, setFilterState] = useState('')
  const isFullPageSize = pageSize === 'full'
  const resolvedLimit = isFullPageSize ? '1000' : pageSize

  const { data, loading, refetch } = useFetch(
    () => getSchemes({ page: '1', limit: resolvedLimit, ...(filterState ? { state: filterState } : {}), ...(!isFullPageSize ? { page: String(page) } : {}) }),
    [page, filterState, resolvedLimit, isFullPageSize]
  )
  const { data: statesData } = useFetch(() => getSchemeStates(), [])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [inputMode, setInputMode] = useState('form')
  const [jsonDraft, setJsonDraft] = useState(prettyJson(createPayloadFromForm(EMPTY)))

  const { mutate: doCreate, loading: creating } = useMutation((b) => createScheme(b))
  const { mutate: doUpdate, loading: updating } = useMutation(({ id, b }) => updateScheme(id, b))

  const totalPages = isFullPageSize ? 1 : (data?.total ? Math.ceil(data.total / Number(pageSize)) : 1)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setInputMode('form')
    setJsonDraft(prettyJson(createPayloadFromForm(EMPTY)))
    setFormOpen(true)
  }

  function openEdit(s) {
    const nextForm = formFromPayload(s)
    setEditing(s)
    setForm(nextForm)
    setInputMode('form')
    setJsonDraft(prettyJson(createPayloadFromForm(nextForm)))
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const body = inputMode === 'json' ? JSON.parse(jsonDraft) : createPayloadFromForm(form)
      if (editing) {
        await doUpdate({ id: editing.id, b: body })
        toast('Scheme updated', 'success')
      } else {
        await doCreate(body)
        toast('Scheme created', 'success')
      }
      setFormOpen(false)
      refetch()
    } catch (err) {
      toast(err instanceof SyntaxError ? 'Invalid JSON. Please check the payload.' : err.message, 'error')
    }
  }

  const f = (k) => (e) => {
    const nextForm = { ...form, [k]: e.target.value }
    setForm(nextForm)
    if (inputMode === 'form') setJsonDraft(prettyJson(createPayloadFromForm(nextForm)))
  }

  function switchMode(mode) {
    if (mode === inputMode) return
    if (mode === 'json') {
      setJsonDraft(prettyJson(createPayloadFromForm(form)))
      setInputMode('json')
      return
    }
    try {
      setForm(formFromPayload(JSON.parse(jsonDraft)))
      setInputMode('form')
    } catch {
      toast('Valid JSON is required before switching back to form view.', 'error')
    }
  }

  async function handleCopyJson() {
    try {
      await copyText(jsonDraft)
      toast('JSON copied', 'success')
    } catch {
      toast('Copy failed. Please copy manually.', 'error')
    }
  }

  async function handlePasteJson() {
    try {
      const text = await readClipboardText()
      if (!text) return
      setJsonDraft(text)
      toast('JSON pasted', 'success')
    } catch {
      toast('Paste blocked. Please paste manually.', 'error')
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <select
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterState}
            onChange={e => { setFilterState(e.target.value); setPage(1) }}
          >
            <option value="">All States</option>
            {statesData?.states?.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={pageSize}
            onChange={e => { setPageSize(e.target.value); setPage(1) }}
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === 'full' ? 'Full' : option}
              </option>
            ))}
          </select>
          <button onClick={refetch} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            <Plus size={16} /> Add Scheme
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : data?.schemes?.length === 0 ? (
        <p className="text-center text-gray-400 py-16 text-sm">No schemes found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data?.schemes?.map(s => (
            <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{s.schemeTitle}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.state}{s.city ? ` · ${s.city}` : ''}</p>
                </div>
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg flex-shrink-0">
                  <Pencil size={14} />
                </button>
              </div>
              <span className="self-start text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                {s.schemetype || 'Scheme'}
              </span>
              {s.applyLink && (
                <a href={s.applyLink} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate">Apply ↗</a>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      <Modal title={editing ? 'Edit Scheme' : 'Add Scheme'} open={formOpen} onClose={() => setFormOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button type="button" onClick={() => switchMode('form')} className={tabCls(inputMode === 'form')}>Form</button>
            <button type="button" onClick={() => switchMode('json')} className={tabCls(inputMode === 'json')}>JSON</button>
          </div>

          {inputMode === 'form' ? (
            <>
              <Row label="Scheme Title *">
                <input required className={inp} value={form.schemeTitle} onChange={f('schemeTitle')} />
              </Row>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Row label="Type">
                  <select className={inp} value={form.schemetype} onChange={f('schemetype')}>
                    {['Scholarship', 'Pension', 'Housing', 'Employment', 'Healthcare', 'Agriculture', 'Education', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Row>
                <Row label="State">
                  <input className={inp} value={form.state} onChange={f('state')} placeholder="Uttar Pradesh" />
                </Row>
              </div>
              <Row label="City">
                <input className={inp} value={form.city} onChange={f('city')} />
              </Row>
              <Row label="Required Docs (comma separated)">
                <input className={inp} value={form.requiredDocs} onChange={f('requiredDocs')} placeholder="Aadhaar Card, Income Certificate" />
              </Row>
              <Row label="Process">
                <textarea rows={3} className={inp} value={form.process} onChange={f('process')} />
              </Row>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Row label="Start Date">
                  <input type="date" className={inp} value={form.schemeStartDate} onChange={f('schemeStartDate')} />
                </Row>
                <Row label="Last Date">
                  <input type="date" className={inp} value={form.schemeLastDate} onChange={f('schemeLastDate')} />
                </Row>
              </div>
              <Row label="Apply Link">
                <input className={inp} value={form.applyLink} onChange={f('applyLink')} placeholder="https://" />
              </Row>
              <Row label="About Scheme">
                <textarea rows={3} className={inp} value={form.aboutScheme} onChange={f('aboutScheme')} />
              </Row>
            </>
          ) : (
            <Row label="Scheme JSON">
              <div className="flex justify-end gap-2 mb-2">
                <button type="button" onClick={handleCopyJson} className={jsonBtnCls}>Copy JSON</button>
                <button type="button" onClick={handlePasteJson} className={jsonBtnCls}>Paste JSON</button>
              </div>
              <textarea
                required
                rows={18}
                className={`${inp} font-mono`}
                value={jsonDraft}
                onChange={e => setJsonDraft(e.target.value)}
                placeholder='{"schemeTitle":"PM Scholarship","requiredDocs":["Aadhaar Card"]}'
              />
            </Row>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={creating || updating} className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {(creating || updating) && <Spinner size={14} />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const inp = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
const tabCls = (active) => `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`
const jsonBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'

function Row({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}
