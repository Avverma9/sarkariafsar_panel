import { useFetch } from '../hooks/useFetch.js'
import { getJobs, getSections, getBlogs, getSchemes, getReminders } from '../api.js'
import { Briefcase, Layers, BookOpen, Landmark, Bell, Clock, ExternalLink } from 'lucide-react'
import Spinner from '../components/Spinner.jsx'
import { Link } from 'react-router-dom'

function StatCard({ title, value, icon: Icon, color, loading }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
    green:  'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  }
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex items-center gap-4">
      <div className={`p-3 rounded-xl flex-shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        {loading
          ? <div className="h-6 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold leading-tight">{value ?? '—'}</p>
        }
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: jobsData,    loading: l1 } = useFetch(() => getJobs({ limit: '1' }), [])
  const { data: sectData,    loading: l2 } = useFetch(() => getSections(), [])
  const { data: blogsData,   loading: l3 } = useFetch(() => getBlogs(), [])
  const { data: schemesData, loading: l4 } = useFetch(() => getSchemes({ limit: '1' }), [])
  const { data: remData,     loading: l5 } = useFetch(() => getReminders(7, 5), [])

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Jobs"    value={jobsData?.total}           icon={Briefcase} color="blue"   loading={l1} />
        <StatCard title="Sections"      value={sectData?.total}           icon={Layers}    color="orange" loading={l2} />
        <StatCard title="Blogs"         value={blogsData?.total}          icon={BookOpen}  color="green"  loading={l3} />
        <StatCard title="Gov Schemes"   value={schemesData?.total}        icon={Landmark}  color="purple" loading={l4} />
      </div>

      {/* Reminders */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Bell size={16} className="text-orange-500" />
          <h2 className="font-semibold text-sm">Deadlines in Next 7 Days</h2>
          <span className="ml-auto text-xs text-gray-400">
            {remData?.total ?? 0} jobs
          </span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {l5 ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : remData?.jobs?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming deadlines</p>
          ) : remData?.jobs?.map(job => (
            <div key={job.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{job.title}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Clock size={11} />
                  Last date: {job.applyLastDate ? new Date(job.applyLastDate).toLocaleDateString('en-IN') : 'N/A'}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0
                ${job.lifecycleStage === 'application_open'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                }`}>
                {job.lifecycleStage?.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <Link to="/jobs" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            View all jobs <ExternalLink size={11} />
          </Link>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/jobs',    label: 'Manage Jobs',    icon: Briefcase, c: 'bg-blue-600'   },
          { to: '/sections',label: 'Manage Sections',icon: Layers,    c: 'bg-orange-500' },
          { to: '/blogs',   label: 'Manage Blogs',   icon: BookOpen,  c: 'bg-green-600'  },
          { to: '/schemes', label: 'Gov Schemes',     icon: Landmark,  c: 'bg-purple-600' },
        ].map(({ to, label, icon: Icon, c }) => (
          <Link
            key={to}
            to={to}
            className={`${c} text-white rounded-xl p-4 flex flex-col gap-2 hover:opacity-90 transition-opacity`}
          >
            <Icon size={22} />
            <span className="text-xs font-semibold leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
