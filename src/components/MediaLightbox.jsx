import { useState, useEffect, useRef, useCallback } from 'react'
import './MediaLightbox.css'

// ── Détection navigateur ────────────────────────────────────
function isFirefox() {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('firefox')
}

function canPlayMp4() {
  const v = document.createElement('video')
  return v.canPlayType('video/mp4; codecs="avc1.42E01E"') !== ''
}

// ── Lightbox complète image + vidéo ─────────────────────────
export function MediaLightbox({ items, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const videoRef = useRef(null)

  const current = items[idx]
  const isVideo = current?.type === 'video'

  // Fermer avec Escape, naviguer avec flèches
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape')      onClose()
      if (e.key === 'ArrowRight')  setIdx(i => Math.min(i + 1, items.length - 1))
      if (e.key === 'ArrowLeft')   setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items.length, onClose])

  // Pause vidéo quand on change de slide
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [idx])

  function prev(e) { e.stopPropagation(); setIdx(i => Math.max(i - 1, 0)) }
  function next(e) { e.stopPropagation(); setIdx(i => Math.min(i + 1, items.length - 1)) }

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>

        {/* Fermer */}
        <button className="lightbox-close" onClick={onClose}>✕</button>

        {/* Compteur */}
        {items.length > 1 && (
          <div className="lightbox-counter">{idx + 1} / {items.length}</div>
        )}

        {/* Média principal */}
        <div className="lightbox-media">
          {isVideo ? (
            <div className="lightbox-video-wrap">
              {isFirefox() && !canPlayMp4() ? (
                <div className="lightbox-firefox-warn">
                  <p>⚠️ Firefox ne peut pas lire cette vidéo.</p>
                  <p>Ouvrez-la directement :</p>
                  <a href={current.url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-outline" onClick={e => e.stopPropagation()}>
                    Ouvrir la vidéo ↗
                  </a>
                  <p className="firefox-hint">
                    Ou utilisez Chrome / Edge pour une lecture directe.
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  className="lightbox-video"
                  onClick={e => e.stopPropagation()}
                  onCanPlay={e => e.target.play().catch(() => {})}
                >
                  <source src={current.url} type="video/mp4" />
                  <source src={current.url} type="video/webm" />
                  <source src={current.url} type="video/ogg" />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              )}
            </div>
          ) : (
            <img src={current.url} alt="" className="lightbox-img" />
          )}
        </div>

        {/* Navigation */}
        {idx > 0 && (
          <button className="lightbox-nav lightbox-prev" onClick={prev}>‹</button>
        )}
        {idx < items.length - 1 && (
          <button className="lightbox-nav lightbox-next" onClick={next}>›</button>
        )}

        {/* Miniatures si plusieurs */}
        {items.length > 1 && (
          <div className="lightbox-thumbs">
            {items.map((item, i) => (
              <button
                key={i}
                className={`lightbox-thumb ${i === idx ? 'active' : ''}`}
                onClick={e => { e.stopPropagation(); setIdx(i) }}
              >
                {item.type === 'video'
                  ? <span className="thumb-video-icon">▶</span>
                  : <img src={item.url} alt="" />
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Vignette vidéo avec preview hover (style YouTube) ────────
export function VideoThumb({ src, onClick }) {
  const videoRef   = useRef(null)
  const timerRef   = useRef(null)
  const [hovering, setHovering] = useState(false)

  function handleMouseEnter() {
    setHovering(true)
    timerRef.current = setTimeout(() => {
      const v = videoRef.current
      if (!v) return
      v.muted = true
      v.currentTime = 0
      v.play().catch(() => {})
    }, 400)
  }

  function handleMouseLeave() {
    clearTimeout(timerRef.current)
    setHovering(false)
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }

  return (
    <div
      className={`video-thumb ${hovering ? 'hovering' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="metadata"
        className="video-thumb-player"
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
      </video>
      <div className={`video-thumb-overlay ${hovering ? 'hidden' : ''}`}>
        <div className="video-play-btn">▶</div>
      </div>
      <div className="video-badge">Vidéo</div>
    </div>
  )
}
