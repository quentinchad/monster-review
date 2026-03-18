import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usersAPI, mediaAPI } from '../services/api'
import { ReviewCard, Spinner, ErrorMsg, SuccessMsg } from '../components/Shared'
import { useAuth } from '../context/AuthContext'
import './Profil.css'

// ── Avatar Cropper — version corrigée ──────────────────────
function AvatarCropper({ imageSrc, onConfirm, onCancel }) {
  const canvasRef  = useRef(null)
  const imgRef     = useRef(null)
  const dragRef    = useRef(null)
  const stateRef   = useRef({ ox: 0, oy: 0, scale: 1 })
  const [scale, setScale] = useState(1)
  const SIZE = 260

  // Dessiner sans composite (évite le canvas tainted/noir)
  const draw = useCallback((ox, oy, sc) => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')

    // 1. Fond noir
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, SIZE, SIZE)

    // 2. Clip circulaire
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.clip()

    // 3. Dessiner l'image dans le cercle
    const w = img.naturalWidth  * sc
    const h = img.naturalHeight * sc
    ctx.drawImage(img, ox, oy, w, h)
    ctx.restore()

    // 4. Bordure verte
    ctx.strokeStyle = '#00e04b'
    ctx.lineWidth   = 3
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2)
    ctx.stroke()
  }, [SIZE])

  useEffect(() => {
    const img = new Image()
    // Pas besoin de crossOrigin car on lit depuis FileReader (data URL locale)
    img.onload = () => {
      imgRef.current = img
      // Calculer scale initial pour couvrir le cercle
      const initScale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
      // Centrer
      const ox = (SIZE - img.naturalWidth  * initScale) / 2
      const oy = (SIZE - img.naturalHeight * initScale) / 2
      stateRef.current = { ox, oy, scale: initScale }
      setScale(initScale)
      draw(ox, oy, initScale)
    }
    img.src = imageSrc
  }, [imageSrc, draw, SIZE])

  // Mouse
  function onPointerDown(e) {
    e.preventDefault()
    const pt = e.touches ? e.touches[0] : e
    dragRef.current = {
      startX: pt.clientX, startY: pt.clientY,
      startOx: stateRef.current.ox, startOy: stateRef.current.oy
    }
  }
  function onPointerMove(e) {
    if (!dragRef.current) return
    e.preventDefault()
    const pt = e.touches ? e.touches[0] : e
    const dx = pt.clientX - dragRef.current.startX
    const dy = pt.clientY - dragRef.current.startY
    const ox = dragRef.current.startOx + dx
    const oy = dragRef.current.startOy + dy
    stateRef.current.ox = ox
    stateRef.current.oy = oy
    draw(ox, oy, stateRef.current.scale)
  }
  function onPointerUp() { dragRef.current = null }

  function handleScale(e) {
    const sc = parseFloat(e.target.value)
    stateRef.current.scale = sc
    setScale(sc)
    draw(stateRef.current.ox, stateRef.current.oy, sc)
  }

  function handleConfirm() {
    const canvas = canvasRef.current
    if (!canvas) return
    // Exporter en JPEG depuis le canvas local (pas de taint)
    canvas.toBlob(blob => {
      if (!blob) return
      onConfirm(blob)
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="cropper-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="cropper-modal">
        <h3>Recadrer la photo</h3>
        <p className="cropper-hint">Glissez pour repositionner · Molette ou slider pour zoomer</p>
        <canvas
          ref={canvasRef}
          width={SIZE} height={SIZE}
          className="cropper-canvas"
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          style={{ cursor: dragRef.current ? 'grabbing' : 'grab', touchAction: 'none' }}
        />
        <div className="cropper-zoom">
          <span>🔍</span>
          <input type="range"
            min={Math.max(SIZE / (imgRef.current?.naturalWidth  || SIZE),
                          SIZE / (imgRef.current?.naturalHeight || SIZE)) * 0.8}
            max={4} step={0.01}
            value={scale} onChange={handleScale}
            className="rating-slider"
            style={{ '--thumb-color': 'var(--green)', flex: 1 }} />
          <span>🔎</span>
        </div>
        <div className="cropper-actions">
          <button className="btn btn-ghost" onClick={onCancel} type="button">Annuler</button>
          <button className="btn btn-primary" onClick={handleConfirm} type="button">✔ Valider</button>
        </div>
      </div>
    </div>
  )
}

// ── Page Profil ─────────────────────────────────────────────
export default function Profil() {
  const { id } = useParams()
  const { user: me, updateUser } = useAuth()

  const [profile, setProfile]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [editMode, setEditMode]       = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [currentPwd, setCurrentPwd]   = useState('')
  const [newPwd, setNewPwd]           = useState('')
  const [saving, setSaving]           = useState(false)
  const [saveError, setSaveError]     = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [cropSrc, setCropSrc]         = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef(null)

  const isMe = me && String(me.id) === String(id)

  useEffect(() => {
    setLoading(true)
    usersAPI.get(id)
      .then(r => { setProfile(r.data); setNewUsername(r.data.username) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleAvatarClick() {
    if (!isMe || uploadingAvatar) return
    fileInputRef.current?.click()
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // Lire en data URL — évite tout problème CORS/taint canvas
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleCropConfirm(blob) {
    setCropSrc(null)
    setUploadingAvatar(true)
    setSaveError('')
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const res  = await mediaAPI.uploadAvatar(file)
      const url  = res.data?.url
      setProfile(prev => ({ ...prev, avatar: url }))
      updateUser({ avatar: url })
      setSaveSuccess('Photo de profil mise à jour !')
      setTimeout(() => setSaveSuccess(''), 3000)
    } catch (err) {
      setSaveError('Erreur upload avatar : ' + err.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaveError(''); setSaveSuccess(''); setSaving(true)
    try {
      const data = {}
      if (newUsername !== profile.username) data.username = newUsername
      if (newPwd) { data.new_password = newPwd; data.current_password = currentPwd }
      if (!Object.keys(data).length) { setSaveError('Aucune modification'); setSaving(false); return }
      const res = await usersAPI.updateMe(data)
      setProfile(prev => ({ ...prev, ...res.data }))
      updateUser(res.data)
      setSaveSuccess('Profil mis à jour !')
      setEditMode(false); setNewPwd(''); setCurrentPwd('')
    } catch (err) { setSaveError(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="page"><div className="container"><Spinner /></div></div>
  if (error || !profile) return <div className="page"><div className="container"><ErrorMsg message={error || 'Profil introuvable'} /></div></div>

  const joinDate = new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div className="page">
      <div className="container">

        {cropSrc && (
          <AvatarCropper
            imageSrc={cropSrc}
            onConfirm={handleCropConfirm}
            onCancel={() => setCropSrc(null)}
          />
        )}

        <div className="profile-header card">
          <div className="profile-avatar-wrap">
            <div
              className={`profile-avatar-container${isMe ? ' clickable' : ''}`}
              onClick={handleAvatarClick}
              title={isMe ? 'Cliquer pour changer la photo' : ''}
            >
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username} className="profile-avatar" />
                : <div className="profile-avatar-default">{profile.username[0].toUpperCase()}</div>
              }
              {isMe && (
                <div className="avatar-hover-overlay">
                  {uploadingAvatar ? <span className="uploading-spinner" /> : '📷'}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect} style={{ display: 'none' }} />
          </div>

          <div className="profile-info">
            <h1>{profile.username}</h1>
            <p className="profile-meta">
              Membre depuis {joinDate} · {profile.review_count} review{profile.review_count > 1 ? 's' : ''}
            </p>
            {saveSuccess && <div className="alert alert-success" style={{ marginTop: 8 }}>{saveSuccess}</div>}
            {saveError  && <div className="alert alert-error"   style={{ marginTop: 8 }}>{saveError}</div>}
          </div>

          {isMe && (
            <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(!editMode)}>
              {editMode ? '✕ Annuler' : '✏️ Modifier le profil'}
            </button>
          )}
        </div>

        {isMe && editMode && (
          <div className="card profile-edit">
            <h3>Modifier le profil</h3>
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="input-group">
                <label>Nouveau pseudo</label>
                <input className="input" value={newUsername}
                  onChange={e => setNewUsername(e.target.value)} minLength={3} maxLength={50} />
              </div>
              <div className="divider" />
              <div className="input-group">
                <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <input className="input" type="password" value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} placeholder="Nouveau mot de passe" />
              </div>
              {newPwd && (
                <div className="input-group">
                  <label>Mot de passe actuel</label>
                  <input className="input" type="password" value={currentPwd}
                    onChange={e => setCurrentPwd(e.target.value)} placeholder="Mot de passe actuel" />
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </form>
          </div>
        )}

        <section className="profile-reviews">
          <div className="section-title">
            <h2>REVIEWS DE <span className="accent">{profile.username.toUpperCase()}</span></h2>
          </div>
          {!profile.reviews?.length ? (
            <div className="empty-state">
              <span>☣</span>
              <p>Aucune review pour le moment.</p>
              {isMe && <Link to="/review/nouveau" className="btn btn-primary">Écrire ma première review</Link>}
            </div>
          ) : (
            <div className="grid-2">
              {profile.reviews.map(r => (
                <div key={r.id} className="review-with-actions">
                  <ReviewCard review={r} />
                  {isMe && (
                    <Link to={`/monsters/${r.drink_slug}`} className="btn btn-ghost btn-sm edit-review-btn">
                      ✏️ Modifier sur la page du Monster
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
