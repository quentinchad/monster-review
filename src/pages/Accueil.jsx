import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reviewsAPI, drinksAPI } from '../services/api'
import { ReviewCard, Spinner, ErrorMsg } from '../components/Shared'
import './Accueil.css'

const SORT_OPTIONS = [
  { value: 'date',    label: 'Plus récentes' },
  { value: 'overall', label: 'Meilleure note globale' },
  { value: 'taste',   label: 'Meilleur goût' },
  { value: 'aura',    label: 'Meilleure aura' },
]

export default function Accueil() {
  const [reviews, setReviews] = useState([])
  const [drinks, setDrinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('date')
  const [drinkFilter, setDrinkFilter] = useState('')

  useEffect(() => {
    drinksAPI.list({ limit: 100 })
      .then(r => setDrinks(r.data?.drinks || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, sort, limit: 12 }
    if (drinkFilter) params.drink_id = drinkFilter
    reviewsAPI.feed(params)
      .then(r => {
        setReviews(r.data?.reviews || [])
        setTotalPages(r.data?.total_pages || 1)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, sort, drinkFilter])

  function handleFilterChange(key, value) {
    setPage(1)
    if (key === 'sort') setSort(value)
    if (key === 'drink') setDrinkFilter(value)
  }

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-text">
            <h1>LA COMMUNAUTÉ<br /><span className="accent">MONSTER ENERGY</span></h1>
            <p>Découvrez, notez et partagez vos reviews de toutes les boissons Monster. Des originales aux éditions limitées.</p>
            <div className="hero-actions">
              <Link to="/monsters" className="btn btn-primary btn-lg">Explorer les boissons</Link>
              <Link to="/classements" className="btn btn-outline btn-lg">Voir les classements</Link>
            </div>
          </div>
          <div className="hero-claw">☣</div>
        </section>

        {/* Filtres */}
        <section className="feed-section">
          <div className="section-title">
            <h2>DERNIÈRES <span className="accent">REVIEWS</span></h2>
          </div>

          <div className="feed-filters">
            <select
              className="input filter-select"
              value={sort}
              onChange={e => handleFilterChange('sort', e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <select
              className="input filter-select"
              value={drinkFilter}
              onChange={e => handleFilterChange('drink', e.target.value)}
            >
              <option value="">Toutes les boissons</option>
              {drinks.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <ErrorMsg message={error} />

          {loading ? (
            <Spinner />
          ) : reviews.length === 0 ? (
            <div className="empty-state">
              <span>☣</span>
              <p>Aucune review pour le moment.</p>
              <Link to="/review/nouveau" className="btn btn-primary">Soyez le premier !</Link>
            </div>
          ) : (
            <div className="grid-2">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
              <span className="page-info">Page {page} / {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
