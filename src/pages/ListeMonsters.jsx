import { useState, useEffect } from 'react'
import { drinksAPI } from '../services/api'
import { DrinkCard, Spinner, ErrorMsg } from '../components/Shared'
import './ListeMonsters.css'

const STATUS_TABS = [
  { value: 'all',          label: 'Toutes' },
  { value: 'active',       label: 'Disponibles' },
  { value: 'discontinued', label: 'Discontinuées' },
]

export default function ListeMonsters() {
  const [drinks,     setDrinks]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [status,     setStatus]     = useState('all')
  const [category,   setCategory]   = useState('')
  const [search,     setSearch]     = useState('')
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total,      setTotal]      = useState(0)

  useEffect(() => {
    setLoading(true)
    const params = { status, page, limit: 24 }
    if (search)   params.search   = search
    if (category) params.category = category
    drinksAPI.list(params)
      .then(r => {
        setDrinks(r.data?.drinks || [])
        setTotalPages(r.data?.total_pages || 1)
        setTotal(r.data?.total || 0)
        // Mettre à jour les catégories seulement au premier chargement
        if (r.data?.categories?.length) setCategories(r.data.categories)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [status, category, search, page])

  function handleSearch(e)  { setSearch(e.target.value); setPage(1) }
  function handleStatus(s)  { setStatus(s);   setPage(1) }
  function handleCategory(c){ setCategory(c); setPage(1) }

  return (
    <div className="page">
      <div className="container">
        <div className="section-title">
          <h1>BOISSONS <span className="accent">MONSTER</span></h1>
          <span className="total-count">{total} boissons</span>
        </div>

        {/* Ligne 1 : statut + recherche */}
        <div className="monsters-filters">
          <div className="status-tabs">
            {STATUS_TABS.map(t => (
              <button
                key={t.value}
                className={`tab-btn ${status === t.value ? 'active' : ''}`}
                onClick={() => handleStatus(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="input search-input"
            placeholder="Rechercher une boisson..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        {/* Ligne 2 : catégories */}
        {categories.length > 0 && (
          <div className="category-filters">
            <button
              className={`cat-btn ${category === '' ? 'active' : ''}`}
              onClick={() => handleCategory('')}
            >
              Toutes les gammes
            </button>
            {categories.map(c => (
              <button
                key={c}
                className={`cat-btn ${category === c ? 'active' : ''}`}
                onClick={() => handleCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <ErrorMsg message={error} />

        {loading ? (
          <Spinner />
        ) : drinks.length === 0 ? (
          <div className="empty-state">
            <span>☣</span>
            <p>Aucune boisson trouvée.</p>
            {(category || search) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setCategory(''); setSearch('') }}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid-3">
            {drinks.map(d => <DrinkCard key={d.id} drink={d} />)}
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
