import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { drinksAPI, reviewsAPI, mediaAPI } from '../services/api'
import { RatingBadge, RatingInput, ReviewCard, Spinner, ErrorMsg } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import './MonsterPage.css'

const SORT_OPTIONS = [
  { value: 'date',    label: 'Plus récentes' },
  { value: 'overall', label: 'Meilleure note globale' },
  { value: 'taste',   label: 'Meilleur goût' },
  { value: 'aura',    label: 'Meilleure aura' },
]

// ── Formulaire inline création / édition ────────────────────
function ReviewInlineForm({ drinkId, existing, onSaved, onCancel }) {
  const [overall,    setOverall]    = useState(parseFloat(existing?.rating_overall  ?? 5))
  const [taste,      setTaste]      = useState(parseFloat(existing?.rating_taste    ?? 5))
  const [aura,       setAura]       = useState(parseFloat(existing?.rating_aura     ?? 5))
  const [text,       setText]       = useState(existing?.text_review ?? '')

  // Médias existants (édition)
  const [existingMedia, setExistingMedia] = useState(existing?.media ?? [])

  // Nouveaux fichiers à uploader
  const [newFiles,   setNewFiles]   = useState([])
  const [thumbIdx,   setThumbIdx]   = useState(null) // index dans newFiles, ou null

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  // Progression upload : { index: N, total: N, percent: 0-100 }
  const [uploadProgress, setUploadProgress] = useState(null)

  // Charger les médias de la review existante au montage
  useEffect(() => {
    if (!existing?.id) return
    reviewsAPI.get(existing.id)
      .then(r => setExistingMedia(r.data?.media ?? []))
      .catch(() => {})
  }, [existing?.id])

  async function handleDeleteMedia(mediaId) {
    try {
      await mediaAPI.delete(mediaId)
      setExistingMedia(prev => prev.filter(m => m.id !== mediaId))
    } catch (err) {
      setError('Impossible de supprimer ce fichier : ' + err.message)
    }
  }

  async function handleSetThumbExisting(media) {
    try {
      await reviewsAPI.setThumbnail(existing.id, media.id)
      setExistingMedia(prev => prev.map(m => ({ ...m, is_thumbnail: m.id === media.id ? 1 : 0 })))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let reviewId
      if (existing) {
        await reviewsAPI.update(existing.id, {
          rating_overall: overall, rating_taste: taste,
          rating_aura: aura, text_review: text,
        })
        reviewId = existing.id
      } else {
        const res = await reviewsAPI.create({
          drink_id: drinkId, rating_overall: overall,
          rating_taste: taste, rating_aura: aura, text_review: text,
        })
        reviewId = res.data?.id
      }
      // Upload nouveaux fichiers avec progression
      for (let i = 0; i < newFiles.length; i++) {
        const isThumb = (thumbIdx === i) && existingMedia.length === 0
        setUploadProgress({ index: i + 1, total: newFiles.length, percent: 0 })
        await mediaAPI.upload(reviewId, newFiles[i], isThumb, (pct) => {
          setUploadProgress({ index: i + 1, total: newFiles.length, percent: pct })
        })
      }
      setUploadProgress(null)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette review et tous ses médias ?')) return
    setSubmitting(true)
    try {
      await reviewsAPI.delete(existing.id)
      onSaved()
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="review-inline-form card">
      <div className="rif-header">
        <h3>{existing ? '✏️ Modifier ma review' : '✏️ Écrire une review'}</h3>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} type="button">✕ Annuler</button>
      </div>

      <form onSubmit={handleSubmit}>
        <ErrorMsg message={error} />

        {/* Notes */}
        <div className="rif-ratings">
          <RatingInput label="Note globale" value={overall} onChange={setOverall} color="#2e7d52" />
          <RatingInput label="Goût"         value={taste}   onChange={setTaste}   color="#92650a" />
          <RatingInput label="Aura canette" value={aura}    onChange={setAura}    color="#1a5c8a" />
        </div>

        {/* Texte */}
        <div className="input-group" style={{ marginTop: 20 }}>
          <label>Votre avis (optionnel)</label>
          <textarea className="input" rows={4} value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Décrivez votre expérience avec cette boisson..." />
        </div>

        {/* Médias existants */}
        {existingMedia.length > 0 && (
          <div className="input-group" style={{ marginTop: 16 }}>
            <label>Médias actuels ({existingMedia.length})</label>
            <div className="media-grid">
              {existingMedia.map(m => (
                <div key={m.id} className={`media-item ${m.is_thumbnail ? 'is-thumb' : ''}`}>
                  {m.type === 'image'
                    ? <img src={m.url} alt="media" />
                    : <div className="media-video-placeholder">🎬<span>Vidéo</span></div>
                  }
                  <div className="media-item-actions">
                    {m.type === 'image' && !m.is_thumbnail && (
                      <button type="button" className="btn btn-ghost btn-sm"
                        onClick={() => handleSetThumbExisting(m)}>
                        Miniature
                      </button>
                    )}
                    {m.is_thumbnail && (
                      <span className="media-thumb-badge">★ Miniature</span>
                    )}
                    <button type="button" className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteMedia(m.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nouveaux fichiers */}
        <div className="input-group" style={{ marginTop: 16 }}>
          <label>{existingMedia.length > 0 ? 'Ajouter des médias' : 'Photos / Vidéos (optionnel)'}</label>
          <input
            type="file" accept="image/*,video/mp4,video/webm" multiple
            className="input"
            onChange={e => {
              const selected = Array.from(e.target.files).slice(0, 10)
              setNewFiles(selected)
              setThumbIdx(selected.length > 0 ? 0 : null)
            }}
          />
          {newFiles.length > 0 && (
            <div className="media-grid">
              {newFiles.map((f, i) => (
                <div key={i} className={`media-item ${thumbIdx === i ? 'is-thumb' : ''}`}>
                  {f.type.startsWith('image/')
                    ? <img src={URL.createObjectURL(f)} alt={f.name} />
                    : <div className="media-video-placeholder">🎬<span>{f.name}</span></div>
                  }
                  <div className="media-item-actions">
                    <button type="button"
                      className={`btn btn-sm ${thumbIdx === i ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setThumbIdx(i)}>
                      {thumbIdx === i ? '★ Miniature' : 'Miniature'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progression upload */}
        {uploadProgress && (
          <div className="upload-progress-wrap">
            <div className="upload-progress-label">
              <span>📤 Envoi fichier {uploadProgress.index}/{uploadProgress.total}</span>
              <span>{uploadProgress.percent}%</span>
            </div>
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${uploadProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="rif-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Enregistrement…' : (existing ? 'Enregistrer' : 'Publier ma review')}
          </button>
          {existing && (
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
              🗑 Supprimer la review
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── Page Monster principale ──────────────────────────────────
export default function MonsterPage() {
  const { slug }  = useParams()
  const { user }  = useAuth()

  const [drink,          setDrink]          = useState(null)
  const [reviews,        setReviews]        = useState([])
  const [myReview,       setMyReview]       = useState(null)
  const [loadingDrink,   setLoadingDrink]   = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [error,          setError]          = useState('')
  const [sort,           setSort]           = useState('date')
  const [page,           setPage]           = useState(1)
  const [totalPages,     setTotalPages]     = useState(1)
  const [showForm,       setShowForm]       = useState(false)
  const [expandIngr,     setExpandIngr]     = useState(false)

  useEffect(() => {
    setLoadingDrink(true)
    drinksAPI.getBySlug(slug)
      .then(r => setDrink(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoadingDrink(false))
  }, [slug])

  function loadReviews() {
    if (!drink) return
    setLoadingReviews(true)
    drinksAPI.getReviews(drink.id, { sort, page, limit: 10 })
      .then(r => {
        const all = r.data?.reviews || []
        setReviews(all)
        setTotalPages(r.data?.total_pages || 1)
        if (user) setMyReview(all.find(rv => rv.user_id === user.id) || null)
      })
      .catch(() => {})
      .finally(() => setLoadingReviews(false))
  }

  useEffect(() => { loadReviews() }, [drink, sort, page])

  function handleSaved() {
    setShowForm(false)
    drinksAPI.getBySlug(slug).then(r => setDrink(r.data)).catch(() => {})
    loadReviews()
  }

  if (loadingDrink) return <div className="page"><div className="container"><Spinner /></div></div>
  if (error || !drink) return <div className="page"><div className="container"><ErrorMsg message={error || 'Boisson introuvable'} /></div></div>

  const img = drink.image || drink.image_url

  return (
    <div className="page">
      <div className="container">

        {/* Fiche boisson */}
        <div className="drink-detail">
          <div className="drink-detail-image">
            {img
              ? <img src={img} alt={drink.name} />
              : <div className="drink-detail-placeholder">☣</div>
            }
          </div>

          <div className="drink-detail-info">
            <div className="drink-detail-badges">
              <span className={`tag tag-${drink.status}`}>
                {drink.status === 'active' ? 'Disponible' : 'Discontinuée'}
              </span>
              {drink.category     && <span className="tag tag-cat">{drink.category}</span>}
              {drink.release_year && <span className="tag tag-cat">{drink.release_year}</span>}
            </div>

            <h1>{drink.name}</h1>
            {drink.description && <p className="drink-description">{drink.description}</p>}

            {(drink.calories != null || drink.sugar_g != null) && (
              <div className="drink-nutrition">
                {drink.calories != null && (
                  <div className="nutrition-item">
                    <span className="nutrition-value">{drink.calories}</span>
                    <span className="nutrition-label">kcal</span>
                  </div>
                )}
                {drink.sugar_g != null && (
                  <div className="nutrition-item">
                    <span className="nutrition-value">{drink.sugar_g}g</span>
                    <span className="nutrition-label">Sucres</span>
                  </div>
                )}
              </div>
            )}

            {drink.review_count > 0 && (
              <div className="drink-scores">
                <h3>Scores moyens <span className="review-count-label">({drink.review_count} review{drink.review_count > 1 ? 's' : ''})</span></h3>
                <div className="scores-grid">
                  <div className="score-item"><span className="score-label">Global</span><RatingBadge value={drink.avg_overall} type="green" size="lg" /></div>
                  <div className="score-item"><span className="score-label">Goût</span><RatingBadge value={drink.avg_taste} type="gold" size="lg" /></div>
                  <div className="score-item"><span className="score-label">Aura</span><RatingBadge value={drink.avg_aura} type="blue" size="lg" /></div>
                </div>
              </div>
            )}

            {(drink.sweeteners || drink.ingredients) && (
              <div className="drink-ingredients">
                {drink.sweeteners && (
                  <div className="ingredient-row">
                    <span className="ingredient-label">Édulcorants :</span>
                    <span>{drink.sweeteners}</span>
                  </div>
                )}
                {drink.ingredients && (
                  <>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setExpandIngr(!expandIngr)}>
                      {expandIngr ? 'Masquer ▲' : 'Voir les ingrédients ▼'}
                    </button>
                    {expandIngr && <p className="ingredient-list">{drink.ingredients}</p>}
                  </>
                )}
              </div>
            )}

            {!user ? (
              <Link to="/connexion" className="btn btn-outline">Connectez-vous pour écrire une review</Link>
            ) : myReview && !showForm ? (
              <div className="my-review-cta">
                <span className="my-review-done">✓ Vous avez déjà reviewé cette boisson</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>✏️ Modifier</button>
              </div>
            ) : !showForm ? (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>✏️ Écrire ma review</button>
            ) : null}
          </div>
        </div>

        {/* Formulaire inline */}
        {user && showForm && (
          <ReviewInlineForm
            drinkId={drink.id}
            existing={myReview || null}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Liste des reviews */}
        <section className="drink-reviews-section">
          <div className="section-title">
            <h2>REVIEWS</h2>
            <select className="input filter-select" value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              style={{ maxWidth: 200, marginLeft: 'auto' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loadingReviews ? <Spinner /> : reviews.length === 0 ? (
            <div className="empty-state">
              <span>☣</span>
              <p>Aucune review pour cette boisson. Soyez le premier !</p>
            </div>
          ) : (
            <div className="grid-2">
              {reviews.map(r => (
                <div key={r.id} className="review-with-edit">
                  <ReviewCard review={r} showDrink={false} />
                  {user && r.user_id === user.id && !showForm && (
                    <button className="btn btn-ghost btn-sm edit-own-btn"
                      onClick={() => setShowForm(true)}>
                      ✏️ Modifier
                    </button>
                  )}
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
        </section>
      </div>
    </div>
  )
}
