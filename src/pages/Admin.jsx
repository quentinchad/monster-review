import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/api'
import { Spinner, ErrorMsg, SuccessMsg } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import './Admin.css'

const CATEGORIES = [
  'Original','Ultra','Lo-Carb','Zero','Juice','Punch','Rehab',
  'Coffee','Hydro','Tea','Nitro','Import','Cocktail','Special','Concentrate'
]

const EMPTY_FORM = {
  name: '', description: '', category: '', status: 'active',
  calories: '', sugar_g: '', sweeteners: '', ingredients: '',
  release_year: '', volume_ml: '', image_url: '',
}

// ── Formulaire ajout / édition ───────────────────────────────
function DrinkForm({ initial, onSaved, onCancel }) {
  // Convertir null → '' pour tous les champs pour éviter l'erreur React "value prop should not be null"
  const sanitize = (obj) => Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)])
  )

  const [form, setForm]       = useState(initial ? sanitize(initial) : { ...EMPTY_FORM })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(initial?.image ?? null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const isEdit = !!initial?.id

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v) })
      if (imageFile) fd.append('image', imageFile)

      if (isEdit) {
        await adminAPI.updateDrink(initial.id, fd)
        setSuccess('Boisson mise à jour !')
      } else {
        await adminAPI.addDrink(fd)
        setSuccess('Boisson ajoutée !')
        setForm(EMPTY_FORM)
        setImageFile(null); setPreview(null)
      }
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="drink-form card">
      <div className="drink-form-header">
        <h3>{isEdit ? `✏️ Modifier — ${initial.name}` : '➕ Ajouter une boisson'}</h3>
        {onCancel && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>✕ Annuler</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="drink-form-body">
        <ErrorMsg message={error} />
        <SuccessMsg message={success} />

        {/* Image */}
        <div className="form-image-row">
          <div className="form-image-preview">
            {preview
              ? <img src={preview} alt="preview" />
              : <span>☣</span>
            }
          </div>
          <div className="form-image-inputs">
            <div className="input-group">
              <label>Image (upload)</label>
              <input type="file" accept="image/*" className="input" onChange={handleImage} />
            </div>
            <div className="input-group">
              <label>Ou URL externe</label>
              <input className="input" value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder="https://..." />
            </div>
          </div>
        </div>

        {/* Infos principales */}
        <div className="form-grid-2">
          <div className="input-group">
            <label>Nom *</label>
            <input className="input" value={form.name} required
              onChange={e => set('name', e.target.value)}
              placeholder="Monster Energy Ultra Red" />
          </div>
          <div className="input-group">
            <label>Catégorie</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">— Choisir —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Statut</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="active">Disponible</option>
              <option value="discontinued">Discontinuée</option>
            </select>
          </div>
          <div className="input-group">
            <label>Année de sortie</label>
            <input className="input" type="number" min="1990" max="2099"
              value={form.release_year} onChange={e => set('release_year', e.target.value)}
              placeholder="2023" />
          </div>
        </div>

        {/* Description */}
        <div className="input-group">
          <label>Description</label>
          <textarea className="input" rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Présentation de la boisson..." />
        </div>

        {/* Nutrition */}
        <div className="form-section-title">Informations nutritionnelles</div>
        <div className="form-grid-3">
          <div className="input-group">
            <label>Calories (kcal / canette)</label>
            <input className="input" type="number" min="0"
              value={form.calories} onChange={e => set('calories', e.target.value)}
              placeholder="160" />
          </div>
          <div className="input-group">
            <label>Sucres (g / canette)</label>
            <input className="input" type="number" min="0" step="0.1"
              value={form.sugar_g} onChange={e => set('sugar_g', e.target.value)}
              placeholder="38" />
          </div>
          <div className="input-group">
            <label>Volume (ml)</label>
            <input className="input" type="number" min="0"
              value={form.volume_ml} onChange={e => set('volume_ml', e.target.value)}
              placeholder="500" />
          </div>
        </div>

        {/* Ingrédients */}
        <div className="input-group">
          <label>Édulcorants</label>
          <input className="input" value={form.sweeteners}
            onChange={e => set('sweeteners', e.target.value)}
            placeholder="Sucre, Glucose..." />
        </div>
        <div className="input-group">
          <label>Ingrédients complets</label>
          <textarea className="input" rows={3} value={form.ingredients}
            onChange={e => set('ingredients', e.target.value)}
            placeholder="Eau carbonatée, Sucre, Taurine, Caféine..." />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
          {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer les modifications' : '➕ Ajouter la boisson')}
        </button>
      </form>
    </div>
  )
}

// ── Page Admin principale ────────────────────────────────────
export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [isAdmin,    setIsAdmin]    = useState(false)
  const [checkDone,  setCheckDone]  = useState(false)
  const [drinks,     setDrinks]     = useState([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [editDrink,  setEditDrink]  = useState(null)  // drink en cours d'édition
  const [showAdd,    setShowAdd]    = useState(false)

  // Vérifier le statut admin
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/connexion'); return }
    adminAPI.check()
      .then(r => {
        if (!r.data?.is_admin) navigate('/')
        else { setIsAdmin(true); setCheckDone(true) }
      })
      .catch(() => navigate('/'))
  }, [user, authLoading])

  // Charger les boissons
  function loadDrinks() {
    setLoading(true)
    adminAPI.listDrinks({ page, limit: 20, search })
      .then(r => {
        setDrinks(r.data?.drinks ?? [])
        setTotal(r.data?.total ?? 0)
        setTotalPages(r.data?.total_pages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (checkDone) loadDrinks() }, [checkDone, page, search])

  function handleSaved() {
    setShowAdd(false)
    setEditDrink(null)
    loadDrinks()
  }

  if (authLoading || !checkDone) return <div className="page"><div className="container"><Spinner /></div></div>

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1>PANNEAU <span className="accent">ADMIN</span></h1>
            <p className="admin-subtitle">Gestion des boissons Monster Energy</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowAdd(!showAdd); setEditDrink(null) }}>
            {showAdd ? '✕ Annuler' : '➕ Ajouter une boisson'}
          </button>
        </div>

        {/* Formulaire ajout */}
        {showAdd && !editDrink && (
          <DrinkForm onSaved={handleSaved} onCancel={() => setShowAdd(false)} />
        )}

        {/* Formulaire édition */}
        {editDrink && (
          <DrinkForm
            initial={editDrink}
            onSaved={handleSaved}
            onCancel={() => setEditDrink(null)}
          />
        )}

        {/* Liste */}
        <div className="section-title" style={{ marginTop: 36 }}>
          <h2>BOISSONS <span className="accent">({total})</span></h2>
          <input
            className="input" style={{ maxWidth: 240, marginLeft: 'auto' }}
            placeholder="Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {loading ? <Spinner /> : (
          <div className="admin-drinks-list">
            {drinks.map(drink => (
              <div key={drink.id} className="admin-drink-row card">
                <div className="admin-drink-img">
                  {drink.image || drink.image_url
                    ? <img src={drink.image || drink.image_url} alt={drink.name} />
                    : <span>☣</span>
                  }
                </div>
                <div className="admin-drink-info">
                  <span className="admin-drink-name">{drink.name}</span>
                  <div className="admin-drink-meta">
                    <span className={`tag tag-${drink.status}`}>
                      {drink.status === 'active' ? 'Disponible' : 'Discontinuée'}
                    </span>
                    {drink.category && <span className="tag tag-cat">{drink.category}</span>}
                    {drink.release_year && <span className="admin-drink-year">{drink.release_year}</span>}
                    <span className="admin-drink-reviews">{drink.review_count} review{drink.review_count > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEditDrink(drink); setShowAdd(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                >
                  ✏️ Modifier
                </button>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
            <span className="page-info">Page {page} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
          </div>
        )}
      </div>
    </div>
  )
}
