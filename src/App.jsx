import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { ToastProvider } from './components/Toast.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Jobs from './pages/Jobs.jsx'
import Sections from './pages/Sections.jsx'
import Blogs from './pages/Blogs.jsx'
import Schemes from './pages/Schemes.jsx'
import SearchPage from './pages/SearchPage.jsx'

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/jobs"     element={<Jobs />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/blogs"    element={<Blogs />} />
            <Route path="/schemes"  element={<Schemes />} />
            <Route path="/search"   element={<SearchPage />} />
            <Route path="*"         element={
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <p className="text-4xl font-bold">404</p>
                <p className="text-sm mt-2">Page not found</p>
              </div>
            } />
          </Routes>
        </Layout>
      </ToastProvider>
    </HashRouter>
  )
}
