import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { drinksAPI, reviewsAPI, mediaAPI } from '../services/api'
import { RatingInput, Spinner, ErrorMsg, SuccessMsg } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import './ReviewForm.css'

export default function CreerReview() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [drinks, setDrinks] = useState([])
  const [drinkId, setDrinkId] = useState(searchParams.get('drink') || '')
  const [overall, setOverall] = useState(5)
  const [taste, setTaste] = useState(5)
  const [aura, setAura] = useState(5)
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [thumbnailIdx, setThumbnailIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    drinksAPI.list({ limit: 200 })
      .then(r => setDrinks(r.data?.drinks || []))
      .catch(() => {})
  }, [])

  if (authLoading) return <div className="page"><div className="container"><Spinner /></div></div>

  if (!user) return (
    <div className="page">
      <div className="container">
        <div className="auth-required">
          <h2>Connexion requise</h2>
          <p>Vous devez être connecté pour écrire une review.</p>
          <Link to="/connexion" className="btn btn-primary">Se connecter</Link>
        </div>
      </div>
    </div>
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!drinkId) return setError('Veuillez sélectionner une boisson.')

    setSubmitting(true)
    try {
      // 1. Créer la review
      const res = await reviewsAPI.create({
        drink_id: parseInt(drinkId),
        rating_overall: overall,
        rating_taste: taste,
        rating_aura: aura,
        text_review: text,
      })
      const reviewId = res.data?.id

      // 2. Upload les médias
      if (files.length > 0 && reviewId) {
        for (let i = 0; i < files.length; i++) {
          const isThumb = i === thumbnailIdx
          await mediaAPI.upload(reviewId, files[i], isThumb)
        }
      }

      setSuccess('Review publiée avec succès !')
      setTimeout(() => navigate(`/monsters/${drinks.find(d => d.id == drinkId)?.slug || ''}`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleFiles(e) {
    const selected = Array.from(e.target.files).slice(0, 10)
    setFiles(selected)
    setThumbnailIdx(0)
  }

  return (
    <div className="page">
      <div className="container">
        <div className="form-page">
          <div className="section-title">
            <h1>ÉCRIRE UNE <span className="accent">REVIEW</span></h1>
          </div>

          <form className="review-form" onSubmit={handleSubmit}>
            <ErrorMsg message={error} />
            <SuccessMsg message={success} />

            {/* Sélection boisson */}
            <div className="input-group">
              <label>Boisson Monster *</label>
              <select
                className="input"
                value={drinkId}
                onChange={e => setDrinkId(e.target.value)}
                required
              >
                <option value="">-- Sélectionnez une boisson --</option>
                {drinks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="ratings-section">
              <h3>Notes</h3>
              <div className="ratings-grid">
                <RatingInput
                  label="Note globale *"
                  value={overall}
                  onChange={setOverall}
                  color="var(--green)"
                />
                <RatingInput
                  label="Goût *"
                  value={taste}
                  onChange={setTaste}
                  color="#f0b429"
                />
                <RatingInput
                  label="Aura de la canette *"
                  value={aura}
                  onChange={setAura}
                  color="#4eaaff"
                />
              </div>
            </div>

            {/* Texte */}
            <div className="input-group">
              <label>Votre avis (optionnel)</label>
              <textarea
                className="input"
                placeholder="Décrivez votre expérience avec cette boisson..."
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
              />
            </div>

            {/* Médias */}
            <div className="input-group">
              <label>Photos / Vidéos (optionnel, max 10)</label>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                multiple
                onChange={handleFiles}
                className="input file-input"
              />
              {files.length > 0 && (
                <div className="file-preview-list">
                  {files.map((f, i) => (
                    <div key={i} className={`file-preview-item ${thumbnailIdx === i ? 'is-thumb' : ''}`}>
                      {f.type.startsWith('image/') && (
                        <img src={URL.createObjectURL(f)} alt={f.name} />
                      )}
                      {f.type.startsWith('video/') && (
                        <span className="file-preview-video">🎬 {f.name}</span>
                      )}
                      <button
                        type="button"
                        className={`btn btn-sm ${thumbnailIdx === i ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setThumbnailIdx(i)}
                      >
                        {thumbnailIdx === i ? '★ Miniature' : 'Définir miniature'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Publication en cours…' : 'Publier ma review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
