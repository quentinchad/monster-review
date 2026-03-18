import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { reviewsAPI, mediaAPI } from '../services/api'
import { RatingInput, Spinner, ErrorMsg, SuccessMsg } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import './ReviewForm.css'

export default function ModifierReview() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [overall, setOverall] = useState(5)
  const [taste, setTaste] = useState(5)
  const [aura, setAura] = useState(5)
  const [text, setText] = useState('')
  const [newFiles, setNewFiles] = useState([])
  const [newThumbIdx, setNewThumbIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    reviewsAPI.get(id)
      .then(r => {
        const rev = r.data
        setReview(rev)
        setOverall(parseFloat(rev.rating_overall))
        setTaste(parseFloat(rev.rating_taste))
        setAura(parseFloat(rev.rating_aura))
        setText(rev.text_review || '')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page"><div className="container"><Spinner /></div></div>
  if (!user || (review && review.user_id !== user.id)) {
    return <div className="page"><div className="container"><ErrorMsg message="Non autorisé" /></div></div>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await reviewsAPI.update(id, {
        rating_overall: overall,
        rating_taste: taste,
        rating_aura: aura,
        text_review: text,
      })

      if (newFiles.length > 0) {
        for (let i = 0; i < newFiles.length; i++) {
          await mediaAPI.upload(parseInt(id), newFiles[i], i === newThumbIdx)
        }
      }

      setSuccess('Review mise à jour !')
      setTimeout(() => navigate(`/monsters/${review.drink_slug}`), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette review ?')) return
    setDeleting(true)
    try {
      await reviewsAPI.delete(id)
      navigate(`/monsters/${review.drink_slug}`)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  async function handleDeleteMedia(mediaId) {
    try {
      await mediaAPI.delete(mediaId)
      setReview(prev => ({
        ...prev,
        media: prev.media.filter(m => m.id !== mediaId)
      }))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="form-page">
          <div className="section-title">
            <h1>MODIFIER MA <span className="accent">REVIEW</span></h1>
          </div>
          {review && <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Boisson : <strong>{review.drink_name}</strong></p>}

          <form className="review-form" onSubmit={handleSubmit}>
            <ErrorMsg message={error} />
            <SuccessMsg message={success} />

            <div className="ratings-section">
              <h3>Notes</h3>
              <div className="ratings-grid">
                <RatingInput label="Note globale *" value={overall} onChange={setOverall} color="var(--green)" />
                <RatingInput label="Goût *" value={taste} onChange={setTaste} color="#f0b429" />
                <RatingInput label="Aura de la canette *" value={aura} onChange={setAura} color="#4eaaff" />
              </div>
            </div>

            <div className="input-group">
              <label>Votre avis</label>
              <textarea className="input" value={text} onChange={e => setText(e.target.value)} rows={5} />
            </div>

            {/* Médias existants */}
            {review?.media?.length > 0 && (
              <div className="input-group">
                <label>Médias existants</label>
                <div className="file-preview-list">
                  {review.media.map(m => (
                    <div key={m.id} className={`file-preview-item ${m.is_thumbnail ? 'is-thumb' : ''}`}>
                      {m.type === 'image' && <img src={m.url} alt="media" />}
                      {m.type === 'video' && <span className="file-preview-video">🎬 Vidéo</span>}
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteMedia(m.id)}>Supprimer</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nouveaux médias */}
            <div className="input-group">
              <label>Ajouter des médias</label>
              <input type="file" accept="image/*,video/mp4,video/webm" multiple onChange={e => setNewFiles(Array.from(e.target.files).slice(0,10))} className="input file-input" />
              {newFiles.length > 0 && (
                <div className="file-preview-list">
                  {newFiles.map((f, i) => (
                    <div key={i} className={`file-preview-item ${newThumbIdx === i ? 'is-thumb' : ''}`}>
                      {f.type.startsWith('image/') && <img src={URL.createObjectURL(f)} alt={f.name} />}
                      <button type="button" className={`btn btn-sm ${newThumbIdx === i ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setNewThumbIdx(i)}>
                        {newThumbIdx === i ? '★ Miniature' : 'Miniature'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Suppression…' : '🗑 Supprimer la review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
