import { useState } from 'react'
import { searchAll } from '../api.js'
import { Search, Briefcase, BookOpen, Landmark, Clock } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'

const typeIcon = { job: Briefcase, blog: BookOpen, scheme: Landmark }
const typeColor = {
  job:    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  blog:   'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  scheme: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
}

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [input, setInput] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!input.trim()) return
    setQ(input.trim())
    setLoading(true)
    setError(null)
    try {
      const res = await searchAll(input.trim(), 20)
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Search box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            placeholder="Search jobs, blogs, schemes..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Spinner size={14} /> : <Search size={14} />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Counts */}
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {data.total} results for <span className="text-blue-600">"{q}"</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(data.counts || {}).map(([type, count]) => (
                <span key={type} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor[type]}`}>
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Result list */}
          {data.results?.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-12 text-center text-sm text-gray-400">
              No results found
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-50 dark:divide-gray-800">
              {data.results?.map((item, i) => {
                const Icon = typeIcon[item.type] || Briefcase
                return (
                  <div key={i} className="px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${typeColor[item.type]}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.sectionName && (
                          <span className="text-[10px] text-gray-400">{item.sectionName}</span>
                        )}
                        {item.date && (
                          <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                            <Clock size={9} />
                            {new Date(item.date).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] capitalize font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      {item.type}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search size={40} strokeWidth={1.2} className="mb-3 opacity-30" />
          <p className="text-sm">Search across jobs, blogs and schemes</p>
        </div>
      )}
    </div>
  )
}
