import { useState } from 'react'
import { useFetch, useMutation } from '../hooks/useFetch.js'
import { getBlogs, createBlog } from '../api.js'
import { Plus, Eye, RefreshCw, X } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import Modal from '../components/Modal.jsx'
import { useToast } from '../components/Toast.jsx'

const EMPTY = {
  slug: '', title: '', excerpt: '', author: 'SarkariAfsar',
  category: 'Career Guide', tags: '', intro: '',
  sections: [{ heading: '', paragraphs: [''], bullets: [] }],
}

export default function Blogs() {
  const toast = useToast()
  const { data, loading, refetch } = useFetch(() => getBlogs(), [])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [viewBlog, setViewBlog] = useState(null)
  const { mutate: doCreate, loading: creating } = useMutation((b) => createBlog(b))

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const body = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        sections: form.sections.map(s => ({
          ...s,
          paragraphs: s.paragraphs.filter(Boolean),
          bullets: s.bullets.filter(Boolean),
        })),
      }
      await doCreate(body)
      toast('Blog created successfully', 'success')
      setFormOpen(false)
      refetch()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  function addSection() {
    setForm(f => ({ ...f, sections: [...f.sections, { heading: '', paragraphs: [''], bullets: [] }] }))
  }
  function removeSection(i) {
    setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }))
  }
  function updateSection(i, key, val) {
    setForm(f => {
      const secs = [...f.sections]
      secs[i] = { ...secs[i], [key]: val }
      return { ...f, sections: secs }
    })
  }
  function addParagraph(i) {
    setForm(f => {
      const secs = [...f.sections]
      secs[i] = { ...secs[i], paragraphs: [...secs[i].paragraphs, ''] }
      return { ...f, sections: secs }
    })
  }
  function updateParagraph(si, pi, val) {
    setForm(f => {
      const secs = [...f.sections]
      const paras = [...secs[si].paragraphs]
      paras[pi] = val
      secs[si] = { ...secs[si], paragraphs: paras }
      return { ...f, sections: secs }
    })
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end gap-2">
        <button onClick={refetch}
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={() => { setForm(EMPTY); setFormOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Blog
        </button>
      </div>

      {/* Blog list */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <span className="text-xs text-gray-500">{data?.total ?? 0} blogs</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={26} /></div>
        ) : data?.blogs?.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No blogs yet</p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {data?.blogs?.map(blog => (
              <div key={blog._id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{blog.title}</p>
                  <p className="text-[11px] text-gray-400 font-mono mt-0.5">{blog.slug}</p>
                </div>
                <button onClick={() => setViewBlog(blog)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">
                  <Eye size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal title="New Blog Post" open={formOpen} onClose={() => setFormOpen(false)} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input required className={inp} value={form.title} onChange={f('title')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input required className={inp} value={form.slug} onChange={f('slug')} placeholder="how-to-apply-upsc" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Excerpt</label>
            <textarea rows={2} className={inp} value={form.excerpt} onChange={f('excerpt')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
              <input className={inp} value={form.author} onChange={f('author')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <input className={inp} value={form.category} onChange={f('category')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
            <input className={inp} value={form.tags} onChange={f('tags')} placeholder="upsc, guide, result" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Intro *</label>
            <textarea required rows={3} className={inp} value={form.intro} onChange={f('intro')} />
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sections</p>
              <button type="button" onClick={addSection}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Section
              </button>
            </div>
            {form.sections.map((sec, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input className={`${inp} flex-1`} value={sec.heading}
                    onChange={e => updateSection(i, 'heading', e.target.value)}
                    placeholder={`Section ${i + 1} heading`} />
                  {form.sections.length > 1 && (
                    <button type="button" onClick={() => removeSection(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {sec.paragraphs.map((p, pi) => (
                    <input key={pi} className={inp} value={p}
                      onChange={e => updateParagraph(i, pi, e.target.value)}
                      placeholder={`Paragraph ${pi + 1}`} />
                  ))}
                  <button type="button" onClick={() => addParagraph(i)}
                    className="text-xs text-blue-600 hover:underline">+ paragraph</button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={creating}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              {creating && <Spinner size={14} />} Publish
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal title={viewBlog?.title || ''} open={!!viewBlog} onClose={() => setViewBlog(null)} wide>
        {viewBlog && (
          <div className="space-y-2">
            <p className="text-xs font-mono text-gray-400">/blog/{viewBlog.slug}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{viewBlog.excerpt}</p>
            <a href={`https://sarkariafsar.com/blog/${viewBlog.slug}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              View on site ↗
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}

const inp = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
