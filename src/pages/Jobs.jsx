import { useEffect, useMemo, useState } from 'react'
import { useFetch, useMutation } from '../hooks/useFetch.js'
import { getJobs, createJob, updateJob, deleteJob } from '../api.js'
import { Plus, Pencil, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/Toast.jsx'

const PAGE_SIZE_OPTIONS = ['25', '50', '100', 'full']
const EMPTY_JOB = {
  title: '', jobtitle: '', advertisement_number: '', conducting_authority: '',
  status: '',
  official_links: { official_website: '', apply_online_portal: '', advertisement_number: '' },
  direct_links: { apply_link: '', notification_pdf: '' },
  important_dates: { heading: 'Important Dates', dates: [] },
  how_to_apply: { heading: 'How to Apply', steps: [] },
  introduction: { heading: 'About', content: '' },
  meta: { description: '', keywords: [] },
  disclaimer: '',
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

function jobFromRecord(job = {}) {
  return {
    title: job.title || '',
    jobtitle: job.jobtitle || '',
    advertisement_number: job.advertisement_number || '',
    conducting_authority: job.conducting_authority || '',
    status: job.status || '',
    official_links: job.official_links || { official_website: '', apply_online_portal: '', advertisement_number: '' },
    direct_links: job.direct_links || { apply_link: '', notification_pdf: '' },
    important_dates: job.important_dates || { heading: 'Important Dates', dates: [] },
    how_to_apply: job.how_to_apply || { heading: 'How to Apply', steps: [] },
    introduction: job.introduction || { heading: 'About', content: '' },
    meta: job.meta || { description: '', keywords: [] },
    disclaimer: job.disclaimer || '',
  }
}

export default function Jobs() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('25')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const isFullPageSize = pageSize === 'full'
  const resolvedLimit = isFullPageSize ? '1000' : pageSize

  const { data, loading, refetch } = useFetch(
    () => getJobs({ page: '1', limit: resolvedLimit, ...(q ? { search: q } : {}), ...(!isFullPageSize ? { page: String(page) } : {}) }),
    [page, q, resolvedLimit, isFullPageSize]
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_JOB)
  const [inputMode, setInputMode] = useState('form')
  const [jsonDraft, setJsonDraft] = useState(prettyJson(EMPTY_JOB))
  const [delTarget, setDelTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const { mutate: doCreate, loading: creating } = useMutation((body) => createJob(body))
  const { mutate: doUpdate, loading: updating } = useMutation(({ id, body }) => updateJob(id, body))
  const { mutate: doDel, loading: deleting } = useMutation((id) => deleteJob(id))

  const totalPages = isFullPageSize ? 1 : (data?.total ? Math.ceil(data.total / Number(pageSize)) : 1)
  const pageJobIds = useMemo(() => (data?.jobs || []).map(job => job.id), [data?.jobs])
  const allOnPageSelected = pageJobIds.length > 0 && pageJobIds.every(id => selectedIds.includes(id))

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => pageJobIds.includes(id)))
  }, [pageJobIds])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_JOB)
    setInputMode('form')
    setJsonDraft(prettyJson(EMPTY_JOB))
    setFormOpen(true)
  }

  function openEdit(job) {
    const nextForm = jobFromRecord(job)
    setEditing(job)
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
        await doUpdate({ id: editing.id, body })
        toast('Job updated successfully', 'success')
      } else {
        await doCreate(body)
        toast('Job created successfully', 'success')
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
      toast('Job deleted', 'success')
      setDelTarget(null)
      refetch()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  async function handleBulkDelete() {
    try {
      await Promise.all(selectedIds.map(id => doDel(id)))
      toast(`${selectedIds.length} jobs deleted`, 'success')
      setSelectedIds([])
      setBulkDeleteOpen(false)
      refetch()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  function toggleSelected(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    setSelectedIds(prev => {
      if (allOnPageSelected) return prev.filter(id => !pageJobIds.includes(id))
      return [...new Set([...prev, ...pageJobIds])]
    })
  }

  function setField(key, val) {
    setForm(f => {
      const nextForm = { ...f, [key]: val }
      if (inputMode === 'form') setJsonDraft(prettyJson(nextForm))
      return nextForm
    })
  }

  function setNested(obj, key, val) {
    setForm(f => {
      const nextForm = { ...f, [obj]: { ...f[obj], [key]: val } }
      if (inputMode === 'form') setJsonDraft(prettyJson(nextForm))
      return nextForm
    })
  }

  function switchMode(mode) {
    if (mode === inputMode) return
    if (mode === 'json') {
      setJsonDraft(prettyJson(form))
      setInputMode('json')
      return
    }
    try {
      setForm(jobFromRecord(JSON.parse(jsonDraft)))
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
        <form
          className="flex gap-2 flex-1"
          onSubmit={e => { e.preventDefault(); setQ(search); setPage(1) }}
        >
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search jobs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            Go
          </button>
          {q && (
            <button type="button" onClick={() => { setSearch(''); setQ(''); setPage(1) }}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
              Clear
            </button>
          )}
        </form>
        <div className="flex flex-wrap gap-2">
          <select
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={pageSize}
            onChange={e => { setPageSize(e.target.value); setPage(1) }}
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === 'full' ? 'Full' : option}
              </option>
            ))}
          </select>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setBulkDeleteOpen(true)}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              <Trash2 size={16} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <button onClick={refetch}
            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Add Job
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500">{loading ? 'Loading...' : `${data?.total ?? 0} total jobs`}</span>
          {pageJobIds.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={allOnPageSelected}
                onChange={toggleSelectAll}
              />
              Select all
            </label>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : data?.jobs?.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">No jobs found</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {data?.jobs?.map(job => (
              <div key={job.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  checked={selectedIds.includes(job.id)}
                  onChange={() => toggleSelected(job.id)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-gray-400">{job.sectionName}</span>
                    {job.applyLastDate && (
                      <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                        <Clock size={9} />
                        {new Date(job.applyLastDate).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={job.status} />
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(job)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDelTarget(job)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
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
      </div>

      <Modal
        title={editing ? 'Edit Job' : 'Add New Job'}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button type="button" onClick={() => switchMode('form')} className={tabCls(inputMode === 'form')}>Form</button>
            <button type="button" onClick={() => switchMode('json')} className={tabCls(inputMode === 'json')}>JSON</button>
          </div>

          {inputMode === 'form' ? (
            <>
              <Row label="Title *">
                <input required className={inp} value={form.title}
                  onChange={e => setField('title', e.target.value)} placeholder="Full job title" />
              </Row>
              <Row label="Job Title">
                <input className={inp} value={form.jobtitle}
                  onChange={e => setField('jobtitle', e.target.value)} placeholder="Short display title" />
              </Row>
              <Row label="Advertisement No.">
                <input className={inp} value={form.advertisement_number}
                  onChange={e => setField('advertisement_number', e.target.value)} />
              </Row>
              <Row label="Conducting Authority">
                <input className={inp} value={form.conducting_authority}
                  onChange={e => setField('conducting_authority', e.target.value)} />
              </Row>
              <Row label="Status">
                <input className={inp} value={form.status}
                  onChange={e => setField('status', e.target.value)} placeholder="e.g. Application open" />
              </Row>

              <hr className="border-gray-100 dark:border-gray-800" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Official Links</p>
              <Row label="Official Website">
                <input className={inp} value={form.official_links?.official_website || ''}
                  onChange={e => setNested('official_links', 'official_website', e.target.value)} placeholder="https://" />
              </Row>
              <Row label="Apply Portal">
                <input className={inp} value={form.official_links?.apply_online_portal || ''}
                  onChange={e => setNested('official_links', 'apply_online_portal', e.target.value)} placeholder="https://" />
              </Row>
              <Row label="Apply Link">
                <input className={inp} value={form.direct_links?.apply_link || ''}
                  onChange={e => setNested('direct_links', 'apply_link', e.target.value)} placeholder="https://" />
              </Row>
              <Row label="Notification PDF">
                <input className={inp} value={form.direct_links?.notification_pdf || ''}
                  onChange={e => setNested('direct_links', 'notification_pdf', e.target.value)} placeholder="https://" />
              </Row>

              <hr className="border-gray-100 dark:border-gray-800" />
              <Row label="Introduction">
                <textarea rows={3} className={inp} value={form.introduction?.content || ''}
                  onChange={e => setNested('introduction', 'content', e.target.value)}
                  placeholder="About this job..." />
              </Row>
              <Row label="Meta Description">
                <textarea rows={2} className={inp} value={form.meta?.description || ''}
                  onChange={e => setNested('meta', 'description', e.target.value)} />
              </Row>
              <Row label="Disclaimer">
                <input className={inp} value={form.disclaimer}
                  onChange={e => setField('disclaimer', e.target.value)} />
              </Row>
            </>
          ) : (
            <Row label="Job JSON">
              <div className="flex justify-end gap-2 mb-2">
                <button type="button" onClick={handleCopyJson} className={jsonBtnCls}>Copy JSON</button>
                <button type="button" onClick={handlePasteJson} className={jsonBtnCls}>Paste JSON</button>
              </div>
              <textarea
                required
                rows={20}
                className={`${inp} font-mono`}
                value={jsonDraft}
                onChange={e => setJsonDraft(e.target.value)}
                placeholder='{"title":"SSC CGL 2026","official_links":{"official_website":"https://..."}}'
              />
            </Row>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={creating || updating}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {(creating || updating) && <Spinner size={14} />}
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delTarget}
        title="Delete Job"
        message={`Are you sure you want to delete "${delTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
        loading={deleting}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete Selected Jobs"
        message={`Are you sure you want to delete ${selectedIds.length} selected jobs?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        loading={deleting}
      />
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

function StatusBadge({ status }) {
  const isOpen = status?.toLowerCase().includes('open')
  return (
    <span className={`hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0
      ${isOpen
        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
      }`}>
      {isOpen ? 'Open' : 'Closed'}
    </span>
  )
}
