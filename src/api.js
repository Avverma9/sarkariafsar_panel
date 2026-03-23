const BASE = 'https://sarkariafsar.com/api'
// const BASE = 'http://localhost:5000/api'


async function req(path, options = {}) {
  const url = BASE + path
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || data?.error || `Error ${res.status}`)
  return data
}

// ── Jobs ─────────────────────────────────────────────
export const getJobs = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/jobs${qs ? '?' + qs : ''}`)
}
export const getJob = (slug) => req(`/jobs/get-post-details/${slug}`)
export const createJob = (body) => req('/jobs', { method: 'POST', body: JSON.stringify(body) })
export const updateJob = (id, body) => req(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteJob = (id) => req(`/jobs/${id}`, { method: 'DELETE' })
export const getReminders = (days = 7, limit = 20) => req(`/jobs/reminder?days=${days}&limit=${limit}`)
export const searchAll = (q, limit = 10) => req(`/jobs/search?q=${encodeURIComponent(q)}&limit=${limit}`)

// ── Sections ─────────────────────────────────────────
export const getSections = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/section/get-all-sections${qs ? '?' + qs : ''}`)
}
export const getSectionsWithJobs = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/section/get-all-sections-with-jobs${qs ? '?' + qs : ''}`)
}
export const createSection = (body) => req('/section', { method: 'POST', body: JSON.stringify(body) })
export const updateSection = (id, body) => req(`/section/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
export const deleteSection = (id) => req(`/section/${id}`, { method: 'DELETE' })
export const seedSections = () => req('/section/seed', { method: 'POST' })

// ── Blogs ─────────────────────────────────────────────
export const getBlogs = () => req('/blog/get-all-blogs')
export const getBlog = (slug) => req(`/blog/get-all-blogs/${slug}`)
export const createBlog = (body) => req('/blog/add-blog', { method: 'POST', body: JSON.stringify(body) })

// ── Gov Schemes ───────────────────────────────────────
export const getSchemes = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req(`/gov-schemes${qs ? '?' + qs : ''}`)
}
export const getScheme = (id) => req(`/gov-schemes/${id}`)
export const getSchemeStates = () => req('/gov-schemes/getSchemeStateNameOnly')
export const getSchemesByState = (state) => req(`/gov-schemes/getSchemeByState?state=${encodeURIComponent(state)}`)
export const createScheme = (body) => req('/gov-schemes', { method: 'POST', body: JSON.stringify(body) })
export const updateScheme = (id, body) => req(`/gov-schemes/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
