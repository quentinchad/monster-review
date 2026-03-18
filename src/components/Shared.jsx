import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MediaLightbox, VideoThumb } from './MediaLightbox'
import './Shared.css'

// --- Badge de note ---
export function RatingBadge({ value, type = 'green', size = 'md' }) {
  const color = type === 'gold' ? '#92650a' : type === 'blue' ? '#1a5c8a' : '#2e7d52'
  const bg    = type === 'gold' ? 'rgba(146,101,10,0.1)' : type === 'blue' ? 'rgba(26,92,138,0.1)' : 'rgba(46,125,82,0.1)'
  const border= type === 'gold' ? 'rgba(146,101,10,0.2)' : type === 'blue' ? 'rgba(26,92,138,0.2)' : 'rgba(46,125,82,0.2)'
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '17px' : '13px'
  const padding  = size === 'sm' ? '2px 8px' : size === 'lg' ? '5px 12px' : '3px 10px'
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding, borderRadius:4,
      fontWeight:700, fontSize, color, background:bg, border:`1px solid ${border}` }}>
      ★ {value !== null && value !== undefined ? Number(value).toFixed(1) : '–'}
    </span>
  )
}

// --- Input note (slider 0-10) ---
export function RatingInput({ label, value, onChange, color = '#2e7d52' }) {
  return (
    <div className="rating-input-group">
      <div className="rating-input-header">
        <label>{label}</label>
        <span className="rating-input-value" style={{ color }}>{Number(value).toFixed(1)}</span>
      </div>
      <input type="range" min={0} max={10} step={0.5} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="rating-slider"
        style={{ '--thumb-color': color }} />
      <div className="rating-input-scale"><span>0</span><span>5</span><span>10</span></div>
    </div>
  )
}

// --- Carte boisson ---
export function DrinkCard({ drink }) {
  const img = drink.image || drink.image_url
  return (
    <Link to={`/monsters/${drink.slug}`} className="card drink-card">
      <div className="drink-card-img-wrap">
        {img
          ? <img src={img} alt={drink.name} loading="lazy" />
          : <div className="drink-card-placeholder">☣</div>
        }
      </div>
      <div className="drink-card-body">
        <div className="drink-card-header">
          <span className={`tag tag-${drink.status}`}>
            {drink.status === 'active' ? 'Disponible' : 'Discontinué'}
          </span>
          {drink.category && <span className="drink-card-cat">{drink.category}</span>}
        </div>
        <h3 className="drink-card-name">{drink.name}</h3>
        <div className="drink-card-stats">
          {drink.avg_overall != null && <RatingBadge value={drink.avg_overall} type="green" size="sm" />}
          {drink.review_count > 0 && (
            <span className="drink-card-reviews">{drink.review_count} review{drink.review_count > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// --- Carte review (feed) ---
export function ReviewCard({ review, showDrink = true }) {
  const drinkImg  = review.drink_image || review.drink_image_url
  const mediaList = review.media ?? []
  const images    = mediaList.filter(m => m.type === 'image')
  const videos    = mediaList.filter(m => m.type === 'video')
  const allMedia  = mediaList // pour la lightbox
  const thumb     = review.thumbnail

  // Si pas de médias uploadés, utiliser l'image de la boisson comme fallback visuel
  const hasUploadedMedia = mediaList.length > 0
  const fallbackImg      = !hasUploadedMedia ? (drinkImg ?? null) : null

  // Lightbox
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const lightboxItems = allMedia.map(m => ({ url: m.url, type: m.type }))

  // Grille d'images à afficher
  // Si médias uploadés : montrer jusqu'à 4 images/vidéos
  // Sinon : fallback image boisson
  const displayMedia = hasUploadedMedia ? mediaList.slice(0, 4) : []
  const extraCount   = hasUploadedMedia && mediaList.length > 4 ? mediaList.length - 4 : 0

  return (
    <div className="card review-card">

      {/* Zone visuelle */}
      <div className="review-card-top-area">
        {!hasUploadedMedia ? (
          /* Pas de médias — image boisson centrée pleine largeur */
          showDrink && drinkImg ? (
            <Link to={`/monsters/${review.drink_slug}`} className="review-card-fallback">
              <img src={drinkImg} alt={review.drink_name} />
            </Link>
          ) : null
        ) : (
          /* Médias uploadés — galerie */
          <div className={`review-card-gallery count-${Math.min(displayMedia.length, 4)}`}>
            {displayMedia.map((m, i) => {
              const mediaIndex = allMedia.findIndex(am => am.url === m.url)
              const isLast     = i === 3 && extraCount > 0
              return (
                <div
                  key={m.id ?? i}
                  className="review-card-gallery-item"
                  onClick={() => setLightboxIdx(mediaIndex >= 0 ? mediaIndex : i)}
                >
                  {m.type === 'video' ? (
                    <VideoThumb src={m.url} onClick={() => {}} />
                  ) : (
                    <img src={m.url} alt="" loading="lazy" />
                  )}
                  {isLast && <div className="gallery-more">+{extraCount}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="review-card-body">
        <div className="review-card-header-row">
          {showDrink && (
            <Link to={`/monsters/${review.drink_slug}`} className="review-card-drink-name">
              {review.drink_name}
            </Link>
          )}
          <span className="review-card-date">{formatDate(review.created_at)}</span>
        </div>

        <div className="review-card-ratings">
          <div className="rating-row"><span className="rating-label">Global</span><RatingBadge value={review.rating_overall} type="green"  size="sm" /></div>
          <div className="rating-row"><span className="rating-label">Goût</span>  <RatingBadge value={review.rating_taste}   type="gold"   size="sm" /></div>
          <div className="rating-row"><span className="rating-label">Aura</span>  <RatingBadge value={review.rating_aura}    type="blue"   size="sm" /></div>
        </div>

        {review.text_review && (
          <p className="review-card-text">{truncate(review.text_review, 180)}</p>
        )}

        <div className="review-card-footer">
          <Link to={`/profil/${review.user_id}`} className="review-card-user">
            {review.avatar
              ? <img src={review.avatar} alt={review.username} className="avatar" width={22} height={22} />
              : <div className="avatar-default" style={{ width:22, height:22, fontSize:10 }}>{review.username?.[0]?.toUpperCase()}</div>
            }
            <span>{review.username}</span>
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && lightboxItems.length > 0 && (
        <MediaLightbox
          items={lightboxItems}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  )
}

// --- Spinner ---
export function Spinner() { return <div className="spinner" /> }

// --- Messages ---
export function ErrorMsg({ message }) {
  if (!message) return null
  return <div className="alert alert-error">{message}</div>
}
export function SuccessMsg({ message }) {
  if (!message) return null
  return <div className="alert alert-success">{message}</div>
}

// --- Helpers ---
function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
}
function truncate(str, len) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}
