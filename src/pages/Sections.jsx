import { useState } from 'react'
import { useFetch, useMutation } from '../hooks/useFetch.js'
import { getSections, createSection, updateSection, deleteSection, seedSections } from '../api.js'
import { Plus, Pencil, Trash2, RefreshCw, Sprout } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/Toast.jsx'

const EMPTY = { name: '', canonicalUrl: '', status: 'active' }
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

export default function Sections() {
  const toast = useToast()
  const { data, loading, refetch } = useFetch(() => getSections(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [inputMode, setInputMode] = useState('form')
  const [jsonDraft, setJsonDraft] = useState(prettyJson(EMPTY))
  const [delTarget, setDelTarget] = useState(null)

  const { mutate: doCreate, loading: creating } = useMutation((b) => createSection(b))
  const { mutate: doUpdate, loading: updating } = useMutation(({ id, b }) => updateSection(id, b))
  const { mutate: doDel, loading: deleting } = useMutation((id) => deleteSection(id))
  const { mutate: doSeed, loading: seeding } = useMutation(() => seedSections())

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setInputMode('form')
    setJsonDraft(prettyJson(EMPTY))
    setFormOpen(true)
  }

  function openEdit(s) {
    const nextForm = {
      name: s.name || '',
      canonicalUrl: s.canonicalUrl || '',
      status: s.status || 'active',
    }
    setEditing(s)
    setForm(nextForm)
    setInputMode('form')
    setJsonDraft(prettyJson(nextForm))
    setFormOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const body = inputMode === 'json' ? JSON.parse(jsonDraft) : form
      if (editing) {
        await doUpdate({ id: editing.id, b: body })
        toast('Section updated', 'success')
      } else {
        await doCreate(body)
        toast('Section created', 'success')
      }
      setFormOpen(false)
      refetch()
    } catch (err) {
      toast(err instanceof SyntaxError ? 'Invalid JSON. Please check the payload.' : err.message, 'error')
    }
  }

  async function handleDelete() {
    try {
      await doDel(delTarget.id)
      toast('Section deleted', 'success')
      setDelTarget(null)
      refetch()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleSeed() {
    try {
      const r = await doSeed()
      toast(`Seeded: ${r.created} created, ${r.updated} updated`, 'success')
      refetch()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const f = (k) => (e) => {
    const nextForm = { ...form, [k]: e.target.value }
    setForm(nextForm)
    if (inputMode === 'form') setJsonDraft(prettyJson(nextForm))
  }

  function switchMode(mode) {
    if (mode === inputMode) return
    if (mode === 'json') {
      setJsonDraft(prettyJson(form))
      setInputMode('json')
      return
    }
    try {
      const parsed = JSON.parse(jsonDraft)
      setForm({
        name: parsed?.name || '',
        canonicalUrl: parsed?.canonicalUrl || '',
        status: parsed?.status || 'active',
      })
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
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex gap-2 justify-end">
        <button onClick={handleSeed} disabled={seeding}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60">
          {seeding ? <Spinner size={14} /> : <Sprout size={14} />} Seed Defaults
        </button>
        <button onClick={refetch}
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={16} /> Add Section
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500">{data?.total ?? 0} sections</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={26} /></div>
        ) : data?.sections?.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No sections. Click "Seed Defaults" to add them.</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {data?.sections?.map(s => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{s.canonicalUrl}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                  ${s.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {s.status}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDelTarget(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal title={editing ? 'Edit Section' : 'Add Section'} open={formOpen} onClose={() => setFormOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button type="button" onClick={() => switchMode('form')} className={tabCls(inputMode === 'form')}>Form</button>
            <button type="button" onClick={() => switchMode('json')} className={tabCls(inputMode === 'json')}>JSON</button>
          </div>

          {inputMode === 'form' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
                <input required className={inp} value={form.name} onChange={f('name')} placeholder="Latest Gov Jobs" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Canonical URL</label>
                <input className={inp} value={form.canonicalUrl} onChange={f('canonicalUrl')} placeholder="latest-gov-jobs" />
                <p className="text-[11px] text-gray-400 mt-1">Leave blank - auto-generated from name</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                <select className={inp} value={form.status} onChange={f('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Section JSON</label>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCopyJson} className={jsonBtnCls}>Copy JSON</button>
                  <button type="button" onClick={handlePasteJson} className={jsonBtnCls}>Paste JSON</button>
                </div>
              </div>
              <textarea
                required
                rows={14}
                className={`${inp} font-mono`}
                value={jsonDraft}
                onChange={e => setJsonDraft(e.target.value)}
                placeholder='{"name":"Latest Gov Jobs","canonicalUrl":"latest-gov-jobs","status":"active"}'
              />
              <p className="text-[11px] text-gray-400 mt-1">Raw JSON payload submit hoga.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={creating || updating} className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {(creating || updating) && <Spinner size={14} />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!delTarget} title="Delete Section"
        message={`Delete "${delTarget?.name}"?`}
        onConfirm={handleDelete} onCancel={() => setDelTarget(null)} loading={deleting} />
    </div>
  )
}

const inp = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
const tabCls = (active) => `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? 'bg-white dark:bg-gray-900 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`
const jsonBtnCls = 'px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800'
