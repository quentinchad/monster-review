// Connexion.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorMsg } from '../components/Shared'
import './Auth.css'

export function Connexion() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="auth-page">
          <div className="auth-card card">
            <div className="auth-header">
              <span className="auth-claw">☣</span>
              <h1>CONNEXION</h1>
              <p>Connectez-vous pour écrire vos reviews</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <ErrorMsg message={error} />
              <div className="input-group">
                <label>Pseudo</label>
                <input className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="Votre pseudo" required autoFocus />
              </div>
              <div className="input-group">
                <label>Mot de passe</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
            <p className="auth-switch">
              Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Inscription() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas')
    setLoading(true)
    try {
      await register(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="auth-page">
          <div className="auth-card card">
            <div className="auth-header">
              <span className="auth-claw">☣</span>
              <h1>INSCRIPTION</h1>
              <p>Rejoignez la communauté Monster Review</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <ErrorMsg message={error} />
              <div className="input-group">
                <label>Pseudo (unique)</label>
                <input className="input" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Choisissez un pseudo" minLength={3} maxLength={50} required autoFocus />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>3-50 caractères, lettres, chiffres, _, -, .</span>
              </div>
              <div className="input-group">
                <label>Mot de passe</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères" minLength={6} required />
              </div>
              <div className="input-group">
                <label>Confirmer le mot de passe</label>
                <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </button>
            </form>
            <p className="auth-switch">
              Déjà un compte ? <Link to="/connexion">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
