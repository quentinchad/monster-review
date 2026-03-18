import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <div className="layout">
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="logo-claw">☣</span>
            <span className="logo-text">MONSTER<span className="logo-accent">REVIEW</span></span>
          </Link>

          <nav className="navbar-links hide-mobile">
            <NavLink to="/" end>Accueil</NavLink>
            <NavLink to="/monsters">Boissons</NavLink>
            <NavLink to="/classements">Classements</NavLink>
          </nav>

          <div className="navbar-actions hide-mobile">
            {user ? (
              <>
                <Link to="/review/nouveau" className="btn btn-primary btn-sm">
                  + Écrire une review
                </Link>
                {user.is_admin && (
                  <Link to="/admin" className="btn btn-ghost btn-sm">⚙ Admin</Link>
                )}
                <Link to={`/profil/${user.id}`} className="navbar-avatar-link">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.username} className="avatar" width={34} height={34} />
                    : <div className="avatar-default">{user.username[0].toUpperCase()}</div>
                  }
                  <span>{user.username}</span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn btn-ghost btn-sm">Connexion</Link>
                <Link to="/inscription" className="btn btn-primary btn-sm">Inscription</Link>
              </>
            )}
          </div>

          <button className="burger show-mobile" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}>Accueil</NavLink>
            <NavLink to="/monsters" onClick={() => setMenuOpen(false)}>Boissons</NavLink>
            <NavLink to="/classements" onClick={() => setMenuOpen(false)}>Classements</NavLink>
            {user ? (
              <>
                <Link to="/review/nouveau" onClick={() => setMenuOpen(false)}>+ Écrire une review</Link>
                <Link to={`/profil/${user.id}`} onClick={() => setMenuOpen(false)}>Mon profil ({user.username})</Link>
                <button onClick={handleLogout}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/connexion" onClick={() => setMenuOpen(false)}>Connexion</Link>
                <Link to="/inscription" onClick={() => setMenuOpen(false)}>Inscription</Link>
              </>
            )}
          </div>
        )}
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span className="logo-claw">☣</span>
          <span>MonsterReview — La communauté Monster Energy française</span>
          <span className="text-muted">Projet non affilié à Monster Energy Company</span>
        </div>
      </footer>
    </div>
  )
}
