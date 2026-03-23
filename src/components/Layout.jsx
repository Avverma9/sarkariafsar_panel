import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, Layers, BookOpen,
  Landmark, Search, Menu, X, ExternalLink
} from 'lucide-react'

const NAV = [
  { to: '/',        label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/jobs',    label: 'Jobs',         icon: Briefcase       },
  { to: '/sections',label: 'Sections',    icon: Layers          },
  { to: '/blogs',   label: 'Blogs',        icon: BookOpen        },
  { to: '/schemes', label: 'Gov Schemes',  icon: Landmark        },
  { to: '/search',  label: 'Search',       icon: Search          },
]

const PAGE_TITLES = {
  '/':         'Dashboard',
  '/jobs':     'Jobs',
  '/sections': 'Sections',
  '/blogs':    'Blogs',
  '/schemes':  'Gov Schemes',
  '/search':   'Search',
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  const segment = '/' + pathname.split('/')[1]
  const pageTitle = PAGE_TITLES[segment] || 'Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#f59e0b' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="white" fillOpacity="0.95" />
              <path d="M9 12l2 2 4-4" stroke="#0f1e3d" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">SarkariAfsar</p>
            <p className="text-[10px] text-blue-300/60">Admin Panel</p>
          </div>
          <button
            className="lg:hidden text-blue-300 hover:text-white"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-blue-400/40 px-3 pt-2 pb-1.5">
            Management
          </p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-200/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-3 border-t border-white/10">
          <a
            href="https://sarkariafsar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-300/50 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={11} />
            sarkariafsar.com
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-20">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base font-semibold flex-1">{pageTitle}</h1>
          <a
            href="https://sarkariafsar.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <ExternalLink size={12} /> View Site
          </a>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-stretch">
        {NAV.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors
              ${isActive
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
