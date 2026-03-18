// ============================================================
// Service API — JWT auth (localStorage)
// ============================================================

const BASE_URL = 'https://www.quentin-chirat.com/monsterenergybackend/api'

// ─── Token storage ───────────────────────────────────────────
export function getToken() {
  return localStorage.getItem('mr_token')
}
export function setToken(token) {
  if (token) localStorage.setItem('mr_token', token)
  else localStorage.removeItem('mr_token')
}

// ─── Requête générique ───────────────────────────────────────
// Routes publiques qui ne nécessitent pas de token
const PUBLIC_ROUTES = ['/drinks', '/reviews', '/rankings']

function isPublicRoute(endpoint) {
  return PUBLIC_ROUTES.some(r => endpoint.startsWith(r)) &&
    ['GET'].includes(arguments[0]) // méthode
}

async function request(method, endpoint, data = null, isFormData = false) {
  const token = getToken()
  const headers = {}

  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token)       headers['Authorization'] = `Bearer ${token}`

  const options = { method, headers }
  if (data && !isFormData) options.body = JSON.stringify(data)
  if (data && isFormData)  options.body = data

  // Ajouter _token en query param pour les requêtes authentifiées
  // (Apache stripe le header Authorization sur OVH)
  // Ne PAS l'ajouter pour les GET publics car le JWT dans l'URL peut causer des erreurs
  let url = `${BASE_URL}${endpoint}`
  const isPublicGet = method === 'GET' && PUBLIC_ROUTES.some(r => endpoint.startsWith(r))
  if (token && !isPublicGet) {
    const sep = url.includes('?') ? '&' : '?'
    url += `${sep}_token=${encodeURIComponent(token)}`
  }

  const res  = await fetch(url, options)
  const json = await res.json()

  if (!json.success && res.status >= 400) {
    throw new Error(json.error || 'Erreur serveur')
  }
  return json
}

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (username, password) =>
    request('POST', '/auth/register', { username, password }),

  login: (username, password) =>
    request('POST', '/auth/login', { username, password }),

  logout: () =>
    request('POST', '/auth/logout'),

  me: () =>
    request('GET', '/auth/me'),
}

// ─── Drinks ───────────────────────────────────────────────────
export const drinksAPI = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/drinks${q ? '?' + q : ''}`)
  },
  get:        (id)           => request('GET', `/drinks/${id}`),
  getBySlug:  (slug)         => request('GET', `/drinks/slug/${slug}`),
  getReviews: (id, params={})=> {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/drinks/${id}/reviews${q ? '?' + q : ''}`)
  },
}

// ─── Reviews ──────────────────────────────────────────────────
export const reviewsAPI = {
  feed: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/reviews${q ? '?' + q : ''}`)
  },
  get:          (id)      => request('GET',    `/reviews/${id}`),
  create:       (data)    => request('POST',   '/reviews', data),
  update:       (id, data)=> request('PUT',    `/reviews/${id}`, data),
  delete:       (id)      => request('DELETE', `/reviews/${id}`),
  setThumbnail: (rid, mid)=> request('PUT',    `/reviews/${rid}/thumbnail`, { media_id: mid }),
}

// ─── Media ────────────────────────────────────────────────────
export const mediaAPI = {
  upload: (reviewId, file, isThumbnail = false) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('review_id', reviewId)
    fd.append('is_thumbnail', isThumbnail ? '1' : '0')
    return request('POST', '/media/upload', fd, true)
  },
  uploadAvatar: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('POST', '/media/avatar', fd, true)
  },
  delete: (id) => request('DELETE', `/media/${id}`),
}

// ─── Users ────────────────────────────────────────────────────
export const usersAPI = {
  get:      (id)   => request('GET', `/users/${id}`),
  updateMe: (data) => request('PUT', '/users/me', data),
}

// ─── Rankings ─────────────────────────────────────────────────
export const rankingsAPI = {
  get: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/rankings${q ? '?' + q : ''}`)
  },
}

// ─── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  check: () => request('GET', '/admin/me'),

  listDrinks: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/admin/drinks${q ? '?' + q : ''}`)
  },
  addDrink: (formData) => request('POST', '/admin/drinks', formData, true),

  updateDrink: (id, formData) => {
    formData.append('_method', 'PUT')
    return request('POST', `/admin/drinks/${id}`, formData, true)
  },
}